// loginAdvertizer.js
import { Advertizer } from "../../../models/Advertizer/index_advertizer.js";
import { GraphQLError } from 'graphql';
import { signAdvertizerToken,getAdvertizerFromToken, generateToken } from '../../../utils/advertizer_auth.js';

import { signAdvertiserToken } from '../../../utils/AuthSystem/tokenUtils.js'
import { USER_TYPES } from "../../../utils/AuthSystem/constant/systemRoles.js";
import { getAccountTypeForAccount, getPermissionSectionsForAccount, getRoleLabelForAccount } from '../../../utils/owner.js';

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

  const permissions = Array.isArray(advertizer.permissions) ? advertizer.permissions : [];
  const permissionSections = getPermissionSectionsForAccount({
    role: advertizer.role,
    isSuperAdmin: advertizer.isSuperAdmin,
    permissions,
  });
  const roleLabel = getRoleLabelForAccount(advertizer);
  const accountType = getAccountTypeForAccount(advertizer);
  const advertizerToken = signAdvertiserToken(
    { ...advertizer.toObject(), permissionSections, roleLabel, accountType },
    USER_TYPES.ADVERTISER
  ); 

  return {
    advertizerToken,
    advertizer: {
      _id: advertizer._id,
      fullName: advertizer.fullName,
      companyName: advertizer.companyName,
      businessEmail: advertizer.businessEmail,
      isConfirmed: advertizer.isConfirmed,
      isPhoneConfirmed: advertizer.isPhoneConfirmed,
      role: advertizer.role,
      isSuperAdmin: advertizer.isSuperAdmin,
      accountType,
      roleLabel,
      permissionSections,
      companyWebsite: advertizer.companyWebsite,
    },
  };
};

export default loginAdvertizer;
