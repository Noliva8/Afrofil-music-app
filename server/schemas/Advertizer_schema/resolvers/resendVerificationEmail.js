import { Advertizer } from "../../../models/Advertizer/index_advertizer.js";
import crypto from 'crypto';
import sendEmail from "../../../utils/emailTransportation.js";
import { GraphQLError } from 'graphql';

const resendAdvertizerVerificationEmail = async (_, { businessEmail }) => {
  try {
    const advertizer = await Advertizer.findOne({ businessEmail });

    if (!advertizer) {
      throw new GraphQLError('Advertiser not found', {
        extensions: { code: 'NOT_FOUND' }
      });
    }

    let { confirmationToken: token, confirmationTokenExpire: expire, fullName } = advertizer;

    const isTokenExpired = !token || !expire || expire < Date.now();

    if (isTokenExpired) {
      // 🔄 Generate a new token and set expiry
      token = crypto.randomBytes(32).toString('hex');
      expire = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

      advertizer.confirmationToken = token;
      advertizer.confirmationTokenExpire = expire;
      await advertizer.save();

      console.log('🔄 New token generated and saved.');
    } else {
      console.log('✅ Reusing existing token.');
    }

    // ✅ Send the email regardless
    const verificationLink = `${process.env.SERVER_URL}/api/verify-advertizer-email?token=${token}`;
    
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

    return {
      success: true,
      message: "Verification email has been resent."
    };

  } catch (err) {
    console.error(err);
    throw new GraphQLError('Failed to resend verification email.', {
      extensions: { code: 'EMAIL_RESEND_FAILED' }
    });
  }
};

export default resendAdvertizerVerificationEmail;
