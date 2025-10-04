// src/graphql/resolvers/mutations/adModeration.js
import { GraphQLError } from 'graphql';
import mongoose from 'mongoose';
import { Ad } from '../../../models/Advertizer/index_advertizer.js';
import sendEmail from '../../../utils/emailTransportation.js';
import { mirrorAdToRedis } from '../../../utils/AdEngine/mirrorAdToRedis.js';
import { createOrUpdateAdRedis } from './Redis/createAdRedis.js';


const UNAUTH = new GraphQLError('Could not authenticate advertiser', {
  extensions: { code: 'UNAUTHENTICATED' }
});
const FORBIDDEN = new GraphQLError('Forbidden', {
  extensions: { code: 'FORBIDDEN' }
});
const NOT_FOUND = new GraphQLError('Ad not found', {
  extensions: { code: 'NOT_FOUND' }
});

function ensureId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new GraphQLError('Invalid adId', { extensions: { code: 'BAD_USER_INPUT' } });
  }
}

// ---- Email templates --------------------------------------------------------

function approvalEmailHTML({ adTitle, campaignId, fullName, companyName }) {
  return `
    <div style="font-family: Inter, Arial, sans-serif; line-height:1.6;">
      <h2>Your Ad Has Been Approved 🎉</h2>
      <p>Hi ${fullName || 'there'},</p>
      <p>Your ad <strong>${adTitle || '(Untitled Ad)'}</strong> for campaign
         <strong>${campaignId || '—'}</strong> has been approved and is ready to run.</p>
      <p>Company: <strong>${companyName || '—'}</strong></p>
      <p>Thanks for advertising with Afrofeel!</p>
      <hr/>
      <p style="color:#777;">— Afrofeel Team</p>
    </div>
  `;
}

function rejectionEmailHTML({ adTitle, campaignId, fullName, companyName, reason }) {
  return `
    <div style="font-family: Inter, Arial, sans-serif; line-height:1.6;">
      <h2>Update on Your Ad Submission</h2>
      <p>Hi ${fullName || 'there'},</p>
      <p>We reviewed your ad <strong>${adTitle || '(Untitled Ad)'}</strong> for campaign
         <strong>${campaignId || '—'}</strong>, and unfortunately we cannot approve it at this time.</p>
      <p><strong>Reason:</strong> ${reason ? reason : 'No reason provided.'}</p>
      <p>Please update the creative or details and resubmit. If you have questions, just reply to this email.</p>
      <hr/>
      <p>Company: <strong>${companyName || '—'}</strong></p>
      <p style="color:#777;">— Afrofeel Team</p>
    </div>
  `;
}

// ---- Mutations --------------------------------------------------------------







export const AdAprouve = async (_parent, { adId, campaignId }, context) => {
  const admin = context.advertizer || context?.req?.advertizer;
  if (!admin) throw UNAUTH;
  if (admin.role !== 'admin') throw FORBIDDEN;

  ensureId(adId);

  const filter = { _id: adId };
  if (campaignId) filter.campaignId = campaignId;

  // Load with advertiser for email
  const existing = await Ad.findOne(filter)
    .populate('advertiserId', 'businessEmail fullName companyName')
    .lean();

  if (!existing) throw NOT_FOUND;

  // If already approved & active, just mirror again and return (idempotent)
  if (existing.isApproved && existing.status === 'active') {
    try {
      await createOrUpdateAdRedis(existing);
    } catch (e) {
      console.error('[approveAd] mirror (idempotent) failed:', e?.message || e);
    }
    const { _id, ...rest } = existing;
    return { id: String(_id), _id, ...rest };
  }

  // Business rule: mark active on approval
  const now = new Date();
  const update = {
    status: 'active',
    isApproved: true,
    approvedAt: now,
    approvedBy: admin.fullName || admin.email || String(admin._id),
    rejectionReason: null,
    updatedAt: now
  };

  // (Optional) enforce payment before approval — uncomment if required:
  // if (!existing.isCostConfirmed || !existing.isPaid) {
  //   throw new Error('Cannot approve: cost not confirmed or unpaid.');
  // }

  const doc = await Ad.findOneAndUpdate(filter, update, { new: true, lean: true });
  if (!doc) throw NOT_FOUND;

  // Mirror to Redis after approval (best-effort)
  try {
    await createOrUpdateAdRedis(doc);
  } catch (e) {
    console.error('[approveAd] mirrorAdToRedis failed:', e?.message || e);
    // don’t throw: approval succeeded in Mongo; Redis can be backfilled later
  }

  // Notify advertiser (best-effort)
  const adv = existing.advertiserId || {};
  if (adv.businessEmail) {
    try {
      await sendEmail(
        adv.businessEmail,
        'Your Afrofeel Ad Has Been Approved',
        approvalEmailHTML({
          adTitle: existing.adTitle,
          campaignId: existing.campaignId,
          fullName: adv.fullName,
          companyName: adv.companyName
        })
      );
    } catch (e) {
      console.error('[approveAd] email send failed:', e?.message || e);
    }
  }

  const { _id, ...rest } = doc;
  return { id: String(_id), _id, ...rest };
};









export const AdReject = async (_parent, { adId, campaignId, rejectionReason }, context) => {
  const admin = context.advertizer || context?.req?.advertizer;
  if (!admin) throw UNAUTH;
  if (admin.role !== 'admin') throw FORBIDDEN;

  ensureId(adId);

  const filter = { _id: adId };
  if (campaignId) filter.campaignId = campaignId;

  const existing = await Ad.findOne(filter)
    .populate('advertiserId', 'businessEmail fullName companyName')
    .lean();
  if (!existing) throw NOT_FOUND;

  const update = {
    status: 'rejected',
    isApproved: false,
    approvedBy: admin.fullName || admin.email || String(admin._id),
    approvedAt: null,
    rejectionReason: rejectionReason || null,
    updatedAt: new Date(),
  };

  const doc = await Ad.findOneAndUpdate(filter, update, { new: true, lean: true });
  if (!doc) throw NOT_FOUND;

  // Mirror to Redis so the active index is updated (will be removed/paused)
  try {
    await mirrorAdToRedis(doc);
  } catch (e) {
    console.error('[AdReject] mirrorAdToRedis failed:', e?.message || e);
  }

  // Notify advertiser — best-effort
  const advertiser = existing.advertiserId || {};
  const to = advertiser.businessEmail;
  if (to) {
    try {
      await sendEmail(
        to,
        'Your Afrofeel Ad Couldn’t Be Approved',
        rejectionEmailHTML({
          adTitle: existing.adTitle,
          campaignId: existing.campaignId,
          fullName: advertiser.fullName,
          companyName: advertiser.companyName,
          reason: rejectionReason
        })
      );
    } catch (e) {
      console.error('[AdReject] email send failed:', e?.message || e);
    }
  }

  const { _id, ...rest } = doc;
  return { id: String(_id), _id, ...rest };
};
