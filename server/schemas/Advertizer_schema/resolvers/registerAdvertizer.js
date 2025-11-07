import { Advertizer } from "../../../models/Advertizer/index_advertizer.js";
import { signAdvertiserToken } from '../../../utils/AuthSystem/tokenUtils.js'
import { USER_TYPES } from "../../../utils/AuthSystem/constant/systemRoles.js";
import crypto from 'crypto';
import sendEmail from "../../../utils/emailTransportation.js";
import { GraphQLError } from 'graphql';
import dotenv from 'dotenv';
dotenv.config();



const registerAdvertizer = async (_, args) => {
  const {
    fullName,
    companyName,
    phoneNumber,
    businessEmail,
    password,
    companyWebsite,
    brandType,
    country,
    acceptedTerms,
    termsVersion
  } = args;

  // 🔐 1. Check if email already exists
  const existing = await Advertizer.findOne({ businessEmail });

  if (existing) {
    // 🔍 Check if already confirmed
    if (existing.isConfirmed) {
      throw new GraphQLError('An account with this email already exists. Please login.', {
        extensions: { code: 'EMAIL_ALREADY_CONFIRMED' }
      });
    }

    // ⚠️ If not confirmed, resend or regenerate token
    let token = existing.confirmationToken;
    let expire = existing.confirmationTokenExpire;
    const isTokenExpired = !token || !expire || expire < Date.now();

    if (isTokenExpired) {
      // Regenerate
      token = crypto.randomBytes(32).toString('hex');
      expire = new Date(Date.now() + 1000 * 60 * 60 * 24);

      existing.confirmationToken = token;
      existing.confirmationTokenExpire = expire;
      await existing.save();

      console.log('🔁 Token expired. New token generated and saved.');
    } else {
      console.log('🔁 Reusing existing valid token.');
    }

    const verificationLink = `${process.env.SERVER_URL}/api/verify-advertizer-email?token=${token}`;

    await sendEmail(
      businessEmail,
      'Verify Your Email - AfroFeel Ads',
      `
        <p>Hello ${existing.fullName},</p>
        <p>Your account is not yet verified. We've sent you a new verification link:</p>
        <a href="${verificationLink}" target="_blank">${verificationLink}</a>
        <p>This link will expire in 24 hours.</p>
      `
    );

    throw new GraphQLError(
      'Your email is registered but not verified. We have resent the confirmation link to your inbox.',
      { extensions: { code: 'EMAIL_NOT_CONFIRMED_RESENT' } }
    );
  }

  // 🔐 2. Generate email confirmation token
  const confirmationToken = crypto.randomBytes(32).toString('hex');
  const confirmationTokenExpire = new Date(Date.now() + 1000 * 60 * 60 * 24);

  const phoneCode = Math.floor(100000 + Math.random() * 900000);

  // ✅ 3. Create new advertiser
  const newAdvertizer = new Advertizer({
    fullName,
    companyName,
    phoneNumber,
    businessEmail,
    password,
    companyWebsite,
    brandType,
    country,
    acceptedTerms,
    acceptedTermsAt: new Date(),
    termsVersion,
    isConfirmed: false,
    confirmationToken,
    confirmationTokenExpire,
    isPhoneConfirmed: false,
    phoneCode
  });

  await newAdvertizer.save();

  const verificationLink = `${process.env.SERVER_URL}/api/verify-advertizer-email?token=${confirmationToken}`;

  await sendEmail(
    businessEmail,
    'Verify Your Email - AfroFeel Ads',
    `
      <p>Hello ${fullName},</p>
      <p>Welcome to AfroFeel Ads!</p>
      <p>Click the link below to verify your email address:</p>
      <a href="${verificationLink}" target="_blank">${verificationLink}</a>
      <p>This link will expire in 24 hours.</p>
    `
  );

  const advertizerToken = signAdvertiserToken(newAdvertizer, USER_TYPES.ADVERTISER );

  return {
    advertizerToken,
    advertizer: newAdvertizer
  };
};


export default registerAdvertizer;
