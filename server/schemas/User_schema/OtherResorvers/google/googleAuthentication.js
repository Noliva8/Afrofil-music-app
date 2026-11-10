import { OAuth2Client } from "google-auth-library";
import crypto from "node:crypto";
import { User } from "../../../../models/User/user_index.js";
import { signUserToken } from "../../../../utils/AuthSystem/tokenUtils.js";


const client = new OAuth2Client();

const getGoogleClientIds = () => [
  process.env.FLOLUP_MOBILE_IOS_GOOGLE_CLIENT_ID,
  process.env.FLOLUP_MOBILE_ANDROID_GOOGLE_CLIENT_ID,
  process.env.FLOLUP_WEB_GOOGLE_CLIENT_ID,
].filter(Boolean);

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const makeUsername = ({ fullName, email }) => {
  const name = String(fullName || "")
    .trim()
    .replace(/[^\p{L}\p{N}._-]+/gu, "")
    .slice(0, 30);
  const fallback = normalizeEmail(email).split("@")[0]
    .replace(/[^\p{L}\p{N}._-]+/gu, "")
    .slice(0, 30);
  const username = name || fallback || `user${Date.now()}`;
  return username.length >= 3 ? username : `${username}user`.slice(0, 30);
};



export const verifyGoogleToken = async ({ idToken }) => {
  if (!idToken) {
    throw new Error("idToken is required.");
  }
console.log('TOKEN RECIEVED:', idToken);
  const clientIds = getGoogleClientIds();

  if (!clientIds.length) {
    throw new Error("No Google client IDs are configured.");
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientIds,
    });

    const payload = ticket.getPayload();

    if (
      !payload?.sub ||
      !payload?.email ||
      payload.email_verified !== true
    ) {
      throw new Error("Incomplete Google account information.");
    }

    return {
      googleId: payload.sub,
      email: normalizeEmail(payload.email),
      fullName: payload.name || "",
    
      isUserEmailVerified: payload.email_verified,
    };
  } catch (error) {
    console.error("Google token verification failed:", error.message);
    throw new Error("Invalid Google authentication token.");
  }
};




// resolver for google login
// -------





export const googleAuth = async (
  parent,
  { idToken },
  _context
) => {
  
  // 1. Verify Google identity
  const googleUser = await verifyGoogleToken({
    idToken,
  });

  const {
    googleId,
    email,
    fullName,
    
    isUserEmailVerified,
  } = googleUser;

  // 2. Find existing Google account
  let user = await User.findOne({ googleId });

  let isNewUser = false;

  // 3. Create account if Google identity is new
  if (!user) {
    // Check whether the email belongs to an existing account
    const existingEmailUser = await User.findOne({ email });

    if (existingEmailUser) {
      // Link Google to the existing account with the same verified email.
      existingEmailUser.googleId = googleId;
      existingEmailUser.isUserEmailVerified = isUserEmailVerified;
      user = await existingEmailUser.save();
    } else {
      user = await User.create({
        googleId,
        email,
        username: makeUsername({ fullName, email }),
        // Google users do not set a password, but the model requires this field.
        // It is random and never exposed to the client.
        password: crypto.randomBytes(32).toString("hex"),
        role: "regular",
        usageType: "personal",
        isUserEmailVerified,
      });

      isNewUser = true;
    }
  }

  // 4. Generate FloLup JWT
  const token = signUserToken(user);

  // 5. Return authenticated user
  return {
    token,
    user,
    isNewUser,
  };
};
