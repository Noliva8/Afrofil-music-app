// loginAdvertizer.js
import { Advertizer } from "../../../models/Advertizer/index_advertizer.js";
import { GraphQLError } from 'graphql';
import { signAdvertizerToken, getAdvertizerFromToken } from '../../../utils/advertizer_auth.js';
// import { generateConfirmationTokenAndSendEmail } from '../../../utils/emailUtils.js';


const loginAdvertizer = async (_, { businessEmail, password }) => {
  const advertizer = await Advertizer.findOne({ businessEmail }).select('+password');

  if (!advertizer) {
    throw new GraphQLError("No account found with this email.", {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  if (!advertizer.isConfirmed) {
    // Optional resend logic
    // await generateConfirmationTokenAndSendEmail(advertizer);
    throw new GraphQLError(
      "Email not verified. We've resent the confirmation email.",
      { extensions: { code: 'EMAIL_NOT_CONFIRMED' } }
    );
  }

  const isMatch = await advertizer.comparePassword(password);
  if (!isMatch) {
    throw new GraphQLError("Invalid credentials.", {
      extensions: { code: 'UNAUTHORIZED' },
    });
  }

  const advertizerToken = signAdvertizerToken(advertizer); // should only encode necessary info
console.log('check the token:', advertizerToken);



  return {
    advertizerToken,
    advertizer: {
      _id: advertizer._id,
      businessEmail: advertizer.businessEmail,
      isConfirmed: advertizer.isConfirmed,
      isPhoneConfirmed: advertizer.isPhoneConfirmed,
      role: advertizer.role,
      companyWebsite: advertizer.companyWebsite,
    },
  };
};

export default loginAdvertizer;
