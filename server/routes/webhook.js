import mongoose from 'mongoose';
import User from '../models/User/User.js';
import Ad from '../models/Advertizer/Ad.js';
import Advertizer from '../models/Advertizer/Advertizer.js';
import sendEmail from '../utils/emailTransportation.js';
import Stripe from 'stripe';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Pricing config (in cents)
const PRICING = {
  MONTHLY: 800,
  ANNUAL: 8000,
};

// Duration in ms
const PLAN_DURATIONS = {
  MONTHLY: 30 * 24 * 60 * 60 * 1000,
  ANNUAL: 365 * 24 * 60 * 60 * 1000,
};

export async function handleInvoicePaymentSucceeded(invoice) {
  console.log('💸 Invoice Payment Succeeded:', invoice.id);

  // ✅ Safely handle payment check
  const isPaid = invoice.status === 'paid' || invoice.paid === true;
  if (!isPaid) {
    console.log('ℹ️ Invoice not marked as paid, skipping processing');
    return;
  }

  // ✅ Extract customer email
  const customerEmail =
    invoice.customer_email ||
    invoice.customer?.email ||
    invoice.metadata?.userEmail;

  if (!customerEmail) {
    console.error('❌ No customer email found in invoice');
    return;
  }

  // ✅ Validate currency
  if (invoice.currency !== 'usd') {
    console.warn(`⚠️ Unsupported currency: ${invoice.currency}`);
    return;
  }

  // ✅ Determine plan
  const amountPaid = invoice.amount_paid;
  let planType, durationInMs;

  if (amountPaid === PRICING.MONTHLY) {
    planType = 'monthly';
    durationInMs = PLAN_DURATIONS.MONTHLY;
  } else if (amountPaid === PRICING.ANNUAL) {
    planType = 'annual';
    durationInMs = PLAN_DURATIONS.ANNUAL;
  } else {
    console.warn(`⚠️ Unrecognized payment amount: ${amountPaid}`);
    return;
  }

  // ✅ Use transaction if enabled
  const useTransaction = process.env.USE_TRANSACTIONS === 'true';
  const session = useTransaction ? await mongoose.startSession() : null;

  if (session) session.startTransaction();

  try {
    const userQuery = User.findOne({ email: customerEmail });
    const user = session ? await userQuery.session(session) : await userQuery;

    if (!user) {
      console.error(`❌ User not found for ${customerEmail}`);
      if (session) await session.abortTransaction();
      return;
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + durationInMs);

    // ✅ Determine if update is needed
    const shouldUpdate =
      !user.subscription ||
      user.subscription.status === 'trialing' ||
      user.subscription.planId !== planType ||
      user.subscription.periodEnd < now ||
      user.role !== 'premium';

    if (shouldUpdate) {
      user.role = 'premium';
      user.subscription = {
        status: 'active',
        planId: planType,
        periodEnd,
        lastPaymentDate: now,
        lastPaymentAmount: amountPaid / 100,
      };

      await user.save({ session });

      if (session) await session.commitTransaction();

      console.log(`✅ Updated user ${user.email} to premium with plan ${planType}`);

      // ✅ Email confirmation
      try {
        const subject =
          user.subscription?.status === 'trialing'
            ? '🎉 Your Afrofeel Premium Trial Has Converted'
            : '🎶 Subscription Updated – Afrofeel Premium';

            console.log(`📧 Preparing to send email to ${user.email}`);


        await sendEmail(
          user.email,
          subject,
          `
          <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
            <h2 style="color: #441a49;">Hi ${user.username || 'there'},</h2>
            <p>We've received your payment of $${(amountPaid / 100).toFixed(2)}.</p>
            <p>Your <strong>${planType}</strong> subscription is now active until ${periodEnd.toLocaleDateString()}.</p>
            <br />
            <p>🎧 Thank you for supporting Afrofeel!</p>
            <p>– The Afrofeel Team</p>
          </div>
          `
        );
        console.log('📧 Confirmation email sent');
      } catch (emailErr) {
        console.error('📧 Failed to send confirmation email:', emailErr);
      }
    } else {
      if (session) await session.abortTransaction();
      console.log(`ℹ️ No subscription update needed for ${user.email}`);
    }
  } catch (err) {
    console.error('❌ Error processing payment:', err);
    if (session?.inTransaction()) await session.abortTransaction();
  } finally {
    if (session) session.endSession();
  }
}


// Session expired

// Main handler function
export async function handleSessionExpired(session) {
  const email = session.customer_email || 
               session.customer_details?.email ||
               session.metadata?.userEmail;

  if (!email) {
    console.warn('⚠️ No email in expired session:', session.id);
    return { success: false, reason: 'no_email' };
  }

  try {
    // 1. Send email only (no DB updates)
    await sendExpiredSessionEmail(email);
    console.log(`📧 Sent reminder to ${email}`);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to process expired session:', error);
    return { success: false, reason: 'email_failed' };
  }
}

// Email helper (standalone)
async function sendExpiredSessionEmail(email) {
  await sendEmail(
    email,
    '🚀 Complete Your Afrofeel Premium Upgrade',
    `
    <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
      <h2 style="color: #441a49;">Hi there,</h2>
      <p>Your Afrofeel Premium upgrade wasn't completed.</p>
      <a href="${process.env.CHECKOUT_URL}" 
         style="background-color: #441a49; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; display: inline-block;">
        Finish Your Upgrade
      </a>
      <p style="margin-top: 20px;">The link expires in 24 hours.</p>
    </div>
    `
  );
}


// handle payment failer
// -----------------

export async function handleInvoicePaymentFailed(invoice) {
  console.log('⚠️ Payment Failed for Invoice:', invoice.id);

  const customerEmail = invoice.customer_email || 
                       invoice.customer?.email || 
                       invoice.metadata?.userEmail;

  if (!customerEmail) {
    console.error('❌ No email found in failed invoice');
    return { success: false, reason: 'no_email' };
  }

  const user = await User.findOne({ email: customerEmail });
  if (!user) {
    console.error(`❌ User not found: ${customerEmail}`);
    return { success: false, reason: 'user_not_found' };
  }

  const isExistingPremium = user.role === 'premium' && 
                          user.subscription?.status === 'active';
  const paymentAttempt = invoice.attempt_count || 1;
  const amountDue = invoice.amount_due / 100;

  try {
    if (isExistingPremium) {
      // For existing premium users
      await handleExistingPremiumFailure(user, invoice);
    } else {
      // For new/failed subscriptions
      await handleNewPremiumFailure(user, invoice);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to handle payment failure:', error);
    return { success: false, reason: 'processing_error' };
  }
}






async function handleExistingPremiumFailure(user, invoice) {
  const gracePeriodDays = 7;
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);

  // Immediate notification
  await sendPaymentFailedEmail(
    user.email,
    invoice.amount_due / 100,
    invoice.attempt_count || 1,
    gracePeriodEnd.toLocaleDateString()
  );

  // Mark as past_due if this is the final attempt
  if (invoice.next_payment_attempt === null) {
    user.subscription.status = 'past_due';
    user.subscription.periodEnd = gracePeriodEnd;
    await user.save();
    console.log(`⚠️ Marked ${user.email} as past_due until ${gracePeriodEnd}`);
  } else {
    console.log(`ℹ️ Payment failed for ${user.email}, grace period active`);
  }
}

async function handleNewPremiumFailure(user, invoice) {
  // Only send notification without changing status
  await sendPaymentFailedEmail(
    user.email,
    invoice.amount_due / 100,
    invoice.attempt_count || 1,
    'immediately' // No grace period for new subscriptions
  );
  console.log(`ℹ️ Initial payment failed for ${user.email}, no status change`);
}

async function sendPaymentFailedEmail(email, amount, attempt, resolutionDate) {
  const isFinalNotice = attempt >= 3;
  const subject = isFinalNotice 
    ? '❗ Final Notice: Payment Failed' 
    : `⚠️ Payment Failed (Attempt ${attempt})`;

  await sendEmail(
    email,
    subject,
    `
    <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
      <h2 style="color: #d32f2f;">${subject}</h2>
      <p>We couldn't process your payment of <strong>$${amount.toFixed(2)}</strong>.</p>
      
      ${isFinalNotice ? `
      <p style="color: #d32f2f; font-weight: bold;">
        Your premium access will end on ${resolutionDate} unless payment is received.
      </p>
      ` : `
      <p>Next attempt: ${resolutionDate}</p>
      `}
      
      <div style="margin: 20px 0;">
        <a href="${process.env.BILLING_PORTAL_URL || 'https://yourdomain.com/billing'}" 
           style="background-color: #441a49; color: white; 
                  padding: 12px 24px; border-radius: 4px; 
                  text-decoration: none; display: inline-block;">
          Update Payment Method
        </a>
      </div>
      
      <p>Need immediate help? Contact <a href="mailto:support@afrofeel.com">support@afrofeel.com</a></p>
      <br/>
      <p>– Afrofeel Billing Team</p>
    </div>
    `
  );
}

// deleted subscription


export async function handleSubscriptionDeleted(subscription) {
  console.log('🗑️ Subscription Deleted:', subscription.id);

  


const customer = await stripe.customers.retrieve(subscription.customer);
const customerEmail = customer.email || subscription.metadata?.userEmail;





  if (!customerEmail) {
    console.error('❌ No email found in deleted subscription');
    return { success: false, reason: 'no_email' };
  }

  const useTransaction = process.env.USE_TRANSACTIONS === 'true';
  const session = useTransaction ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const user = await User.findOne({ email: customerEmail })
                         .session(session || null);

    if (!user) {
      console.error(`❌ User not found: ${customerEmail}`);
      if (session) await session.abortTransaction();
      return { success: false, reason: 'user_not_found' };
    }

    // Only downgrade if subscription was active/past_due
    const shouldDowngrade = ['active', 'past_due'].includes(user.subscription?.status);

    if (shouldDowngrade) {
      // Downgrade user
      user.role = 'regular';
      user.subscription = {
        status: 'canceled',
        planId: null,
        periodEnd: null
      };

      await user.save({ session });
      if (session) await session.commitTransaction();

      console.log(`⬇️ Downgraded ${user.email} to regular`);

      // Send cancellation confirmation
      await sendSubscriptionCancelledEmail(user.email, subscription.cancel_at_period_end);
    } else {
      if (session) await session.abortTransaction();
      console.log(`ℹ️ No action needed for ${user.email} (status: ${user.subscription?.status})`);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Subscription deletion processing failed:', error);
    if (session?.inTransaction()) await session.abortTransaction();
    return { success: false, reason: 'processing_error' };
  } finally {
    if (session) session.endSession();
  }
}

async function sendSubscriptionCancelledEmail(email, wasScheduledCancellation) {
  const subject = wasScheduledCancellation 
    ? '👋 Your Afrofeel Premium Has Ended' 
    : '😢 Sorry to See You Go';

  await sendEmail(
    email,
    subject,
    `
    <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
      <h2 style="color: #441a49;">${subject}</h2>
      
      ${wasScheduledCancellation ? `
      <p>Your Premium subscription has now ended as requested.</p>
      ` : `
      <p>We've processed your subscription cancellation.</p>
      `}
      
      <p>You'll now have access to regular member features.</p>
      
      <div style="margin: 20px 0;">
        <a href="${process.env.RESUBSCRIBE_URL || 'https://yourdomain.com/premium'}" 
           style="background-color: #441a49; color: white; 
                  padding: 12px 24px; border-radius: 4px; 
                  text-decoration: none; display: inline-block;">
          Rejoin Premium
        </a>
      </div>
      
      <p>Your playlists and favorites remain intact.</p>
      <p>Want feedback? <a href="mailto:feedback@afrofeel.com">Tell us why you left</a></p>
      <br/>
      <p>– The Afrofeel Team</p>
    </div>
    `
  );
}


// Update subscription


export async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Subscription Updated:', subscription.id);

  const customerEmail = subscription.customer_email || 
                       subscription.customer?.email || 
                       subscription.metadata?.userEmail;

  if (!customerEmail) {
    console.error('❌ No email found in subscription update');
    return { success: false, reason: 'no_email' };
  }

  const useTransaction = process.env.USE_TRANSACTIONS === 'true';
  const session = useTransaction ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const user = await User.findOne({ email: customerEmail })
                         .session(session || null);

    if (!user) {
      console.error(`❌ User not found: ${customerEmail}`);
      if (session) await session.abortTransaction();
      return { success: false, reason: 'user_not_found' };
    }

    const newStatus = subscription.status;
    const previousStatus = user.subscription?.status || 'none';
    const isNewPlan = subscription.metadata?.new_plan === 'true';

    console.log(`🔄 Status Change: ${previousStatus} → ${newStatus}`);

    // Handle status transitions
    switch (newStatus) {
      case 'active':
        await handleActiveSubscription(user, subscription, previousStatus, isNewPlan);
        break;
        
      case 'past_due':
        await handlePastDueSubscription(user, subscription);
        break;
        
      case 'canceled':
        await handleCanceledSubscription(user, subscription);
        break;
        
      case 'trialing':
        await handleTrialingSubscription(user, subscription);
        break;
        
      default:
        console.warn(`⚠️ Unhandled subscription status: ${newStatus}`);
    }

    if (session) await session.commitTransaction();
    return { success: true };
  } catch (error) {
    console.error('❌ Subscription update processing failed:', error);
    if (session?.inTransaction()) await session.abortTransaction();
    return { success: false, reason: 'processing_error' };
  } finally {
    if (session) session.endSession();
  }
}

async function handleActiveSubscription(user, subscription, previousStatus, isNewPlan) {
  const planId = subscription.items.data[0].price.id.includes('annual') 
               ? 'annual_plan' 
               : 'monthly_plan';
  
  // Calculate period end (convert Unix timestamp to Date)
  const periodEnd = new Date(subscription.current_period_end * 1000);

  user.role = 'premium';
  user.subscription = {
    status: 'active',
    planId,
    periodEnd
  };

  await user.save();

  // Only send email for specific transitions
  if (previousStatus === 'trialing' || previousStatus === 'past_due' || isNewPlan) {
    await sendSubscriptionUpdatedEmail(
      user.email,
      'active',
      planId,
      periodEnd,
      previousStatus
    );
  }
}

async function handlePastDueSubscription(user, subscription) {
  user.subscription.status = 'past_due';
  await user.save();
  
  await sendSubscriptionUpdatedEmail(
    user.email,
    'past_due',
    user.subscription.planId,
    new Date(subscription.current_period_end * 1000)
  );
}

async function handleCanceledSubscription(user, subscription) {
  // Only downgrade if not already canceled
  if (user.subscription?.status !== 'canceled') {
    user.role = 'regular';
    user.subscription = {
      status: 'canceled',
      planId: null,
      periodEnd: null
    };
    await user.save();
  }

  await sendSubscriptionUpdatedEmail(
    user.email,
    'canceled',
    null,
    null,
    null,
    subscription.cancel_at_period_end
  );
}

async function handleTrialingSubscription(user, subscription) {
  const periodEnd = new Date(subscription.trial_end * 1000);
  
  user.subscription = {
    status: 'trialing',
    planId: 'trial_plan',
    periodEnd
  };
  
  await user.save();
  await sendTrialStartedEmail(user.email, periodEnd);
}

// Email template selector
async function sendSubscriptionUpdatedEmail(email, newStatus, planId, periodEnd, previousStatus, wasScheduled = false) {
  let subject, content;

  switch (newStatus) {
    case 'active':
      subject = previousStatus === 'past_due' 
        ? '✅ Payment Successful - Subscription Reactivated' 
        : '🎉 Subscription Activated';
      content = `Your ${planId} is now active until ${periodEnd.toLocaleDateString()}`;
      break;
      
    case 'past_due':
      subject = '⚠️ Payment Required';
      content = `Your subscription is past due. Update payment method to avoid interruption.`;
      break;
      
    case 'canceled':
      subject = wasScheduled 
        ? '👋 Your Subscription Has Ended' 
        : '😢 Sorry to See You Go';
      content = wasScheduled
        ? 'Your subscription has ended as requested.'
        : 'We\'ve processed your cancellation.';
      break;
  }

  await sendEmail(
    email,
    subject,
    `
    <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
      <h2 style="color: #441a49;">${subject}</h2>
      <p>${content}</p>
      
      ${newStatus === 'canceled' ? `
      <div style="margin: 20px 0;">
        <a href="${process.env.RESUBSCRIBE_URL}" 
           style="background-color: #441a49; color: white; 
                  padding: 12px 24px; border-radius: 4px; 
                  text-decoration: none; display: inline-block;">
          Rejoin Premium
        </a>
      </div>
      ` : ''}
      
      ${newStatus === 'past_due' ? `
      <div style="margin: 20px 0;">
        <a href="${process.env.BILLING_PORTAL_URL}" 
           style="background-color: #441a49; color: white; 
                  padding: 12px 24px; border-radius: 4px; 
                  text-decoration: none; display: inline-block;">
          Update Payment Method
        </a>
      </div>
      ` : ''}
      
      <p>Need help? Contact <a href="mailto:support@afrofeel.com">support@afrofeel.com</a></p>
      <br/>
      <p>– Afrofeel Team</p>
    </div>
    `
  );
}



// handle payment intent




const fmtMoney = (cents, currency = 'usd') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() })
    .format((cents || 0) / 100);


const safeDate = (ts) => (typeof ts === 'number' ? new Date(ts * 1000) : new Date());

export async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    // 1) Pull metadata
    const adId = paymentIntent?.metadata?.adId;
    const advertiserId = paymentIntent?.metadata?.advertiserId;

    if (!adId) {
      console.warn('PaymentIntent succeeded but missing adId in metadata:', paymentIntent.id);
      return;
    }

    // 2) Load the ad
    const ad = await Ad.findById(adId);
    if (!ad) {
      console.warn('Ad not found for adId:', adId, 'PI:', paymentIntent.id);
      return;
    }

    // 3) Idempotency: if already marked paid with this PI, skip
    if (ad.isPaid && ad.payment?.intentId === paymentIntent.id) {
      console.log('Ad already marked paid for this PI, skipping:', adId, paymentIntent.id);
      return;
    }

    // 4) Persist payment details
    const update = {
      isPaid: true,
      paidAt: safeDate(paymentIntent.created),
      status: ad.status === 'draft' ? 'active' : ad.status, // optional: activate if you want
      payment: {
        provider: 'stripe',
        intentId: paymentIntent.id,
        latestChargeId: paymentIntent.latest_charge || null,
        amountReceived: paymentIntent.amount_received || 0,
        currency: paymentIntent.currency || 'usd',
      },
    };

    // Use a conditional update to avoid double-writes on retries
    const updatedAd = await Ad.findOneAndUpdate(
      { _id: adId, $or: [{ isPaid: { $ne: true } }, { 'payment.intentId': { $ne: paymentIntent.id } }] },
      { $set: update },
      { new: true }
    );

    console.log('✅ Ad marked paid:', updatedAd?._id?.toString() || adId);

    // 5) Resolve recipient email
    let recipientEmail = null;
    let advertiserName = '';

    if (advertiserId) {
      const user = await User.findById(advertiserId).select('email name').lean();
      recipientEmail = user?.email || null;
      advertiserName = user?.name || '';
    }

    if (!recipientEmail && paymentIntent.receipt_email) {
      recipientEmail = paymentIntent.receipt_email;
    }

    if (!recipientEmail && paymentIntent.latest_charge) {
      try {
        const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
        recipientEmail = charge?.billing_details?.email || recipientEmail;
      } catch (e) {
        console.warn('Could not retrieve charge to find email:', e.message);
      }
    }

    // 6) Send confirmation email (using your template style)
    if (recipientEmail) {
      const prettyAmount = fmtMoney(paymentIntent.amount_received, paymentIntent.currency);
      const subject = 'Payment received — your ad is now active';
      const content = [
        `Hi${advertiserName ? ` ${advertiserName}` : ''},`,
        `We’ve received your payment of <strong>${prettyAmount}</strong> for the ad <strong>“${updatedAd?.adTitle || ad.adTitle}”</strong>.`,
        updatedAd?.schedule?.startDate && updatedAd?.schedule?.endDate
          ? `Your campaign “${updatedAd.campaignId}” is scheduled from <strong>${new Date(updatedAd.schedule.startDate).toDateString()}</strong> to <strong>${new Date(updatedAd.schedule.endDate).toDateString()}</strong>.`
          : '',
        `You can view or manage your ad any time from your dashboard.`,
      ].filter(Boolean).join('<br/><br/>');

      // Optional status buttons from your example aren’t relevant here; define newStatus=null
      const newStatus = null;

     await sendEmail(
  recipientEmail,
  subject,
  `
  <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
    <h2 style="color: #441a49;">${subject}</h2>
    <p>${content}</p>

    <!-- NEW: review notice -->
    <p style="margin-top: 12px;">
      Your ad has been received and is currently <strong>under review</strong>.
      You’ll receive an approval email within <strong>24 hours</strong>.
    </p>

    <div style="margin: 20px 0;">
      <a href="${process.env.DASHBOARD_URL || 'https://afrofeel.com/dashboard/ads'}"
         style="background-color: #441a49; color: white; padding: 12px 24px; border-radius: 4px;
                text-decoration: none; display: inline-block;">
        View your ad
      </a>
    </div>

    ${newStatus === 'canceled' ? `
      <div style="margin: 20px 0;">
        <a href="${process.env.RESUBSCRIBE_URL || '#'}"
           style="background-color: #441a49; color: white; padding: 12px 24px; border-radius: 4px;
                  text-decoration: none; display: inline-block;">
          Rejoin Premium
        </a>
      </div>` : ''}

    ${newStatus === 'past_due' ? `
      <div style="margin: 20px 0;">
        <a href="${process.env.BILLING_PORTAL_URL || '#'}"
           style="background-color: #441a49; color: white; padding: 12px 24px; border-radius: 4px;
                  text-decoration: none; display: inline-block;">
          Update Payment Method
        </a>
      </div>` : ''}

    <p>Need help? Contact <a href="mailto:support@afrofeel.com">support@afrofeel.com</a></p>
    <br/>
    <p>– Afrofeel Team</p>
  </div>
  `
);


      console.log('📨 Confirmation email sent to:', recipientEmail);
    } else {
      console.warn('Payment succeeded but no recipient email found for adId:', adId);
    }
  } catch (err) {
    console.error('handlePaymentIntentSucceeded error:', err);
    throw err; // so your webhook route can 5xx and Stripe can retry
  }
}

// -------------------------------






const escapeHtml = (s) =>
  String(s || '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));


// 🔴 payment failed → keep ad unpaid, notify user with retry link
export async function handlePaymentIntentFailed(pi) {
  try {
    console.log('payment_intent.payment_failed:', pi.id);

    const adId = pi?.metadata?.adId;
    const advertiserId = pi?.metadata?.advertiserId; // ✅ fixed spelling
    const reason = pi?.last_payment_error?.message || pi?.last_payment_error?.code || 'Payment failed';
    if (!adId) {
      console.warn('PI failed without adId metadata:', pi.id);
      return;
    }

    // 1) Fetch the ad to get title, etc.
    const ad = await Ad.findById(adId);
    const adTitle = ad?.adTitle || 'your ad';

    // 2) Persist "failed" state (idempotent-safe)
    await Ad.updateOne(
      { _id: adId },
      {
        $set: {
          isPaid: false,
          paidAt: null,
          status: 'payment_failed',
          payment: {
            provider: 'stripe',
            intentId: pi.id,
            latestChargeId: pi.latest_charge || null,
            amountReceived: pi.amount_received || 0,
            currency: pi.currency || 'usd'
          }
        }
      }
    );

    // 3) Resolve recipient email (DB → PI → Charge)
    let recipientEmail = null;
    let advertiserName = '';
    if (advertiserId) {
      const user = await User.findById(advertiserId).select('email name').lean();
      recipientEmail = user?.email || null;
      advertiserName = user?.name || '';
    }
    if (!recipientEmail && pi.receipt_email) recipientEmail = pi.receipt_email;
    if (!recipientEmail && pi.latest_charge) {
      try {
        const charge = await stripe.charges.retrieve(pi.latest_charge);
        recipientEmail = charge?.billing_details?.email || recipientEmail;
      } catch (e) {
        console.warn('Could not retrieve charge for email:', e.message);
      }
    }

    // 4) Compose + send email
    if (recipientEmail) {
      const prettyAmount = fmtMoney(pi.amount || pi.amount_received || 0, pi.currency);
      const subject = 'Payment failed — please try again';
      const retryUrl =
        (process.env.AD_PAYMENT_RETRY_URL && `${process.env.AD_PAYMENT_RETRY_URL}?adId=${encodeURIComponent(adId)}`) ||
        `${(process.env.DASHBOARD_URL || 'https://afrofeel.com/dashboard/ads')}?adId=${encodeURIComponent(adId)}`;

      const content = `
        Hi${advertiserName ? ` ${escapeHtml(advertiserName)}` : ''},<br/><br/>
        We tried to process your payment of <strong>${prettyAmount}</strong> for <strong>“${escapeHtml(adTitle)}”</strong>, but it didn’t go through.<br/>
        <em>Reason:</em> ${escapeHtml(reason)}.
      `;

      const newStatus = null; // reuse your template switch (not relevant for ads)

      await sendEmail(
        recipientEmail,
        subject,
        `
        <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
          <h2 style="color: #441a49;">${subject}</h2>
          <p>${content}</p>

          <div style="margin: 20px 0;">
            <a href="${retryUrl}"
               style="background-color: #441a49; color: white; padding: 12px 24px; border-radius: 4px;
                      text-decoration: none; display: inline-block;">
              Try again
            </a>
          </div>

          <p>If the issue persists, try a different card or contact our team.</p>

          <p>Need help? Contact <a href="mailto:support@afrofeel.com">support@afrofeel.com</a></p>
          <br/>
          <p>– Afrofeel Team</p>
        </div>
        `
      );

      console.log('📨 Failure email sent to:', recipientEmail);
    } else {
      console.warn('Payment failed but no recipient email found for adId:', adId);
    }
  } catch (err) {
    console.error('handlePaymentIntentFailed error:', err);
    throw err; // let the webhook return 5xx so Stripe can retry if needed
  }
}


