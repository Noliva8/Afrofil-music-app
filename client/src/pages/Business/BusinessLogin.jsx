import { gql, useLazyQuery, useMutation } from "@apollo/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { AuthFormContainer, LoginForm, SignupForm } from "../LoginSignin";
import UserAuth from "../../utils/auth";
import { LOGIN_USER } from "../../utils/mutations";
import { SitemarkIcon } from "../../components/themeCustomization/customIcon";

const BUSINESS_ACCOUNT_STATUS = gql`
  query BusinessAccountStatus($email: String!) {
    businessAccountStatus(email: $email) {
      exists
      email
      usageType
      hasBusinessUsage
      isUserEmailVerified
      isBusinessProfileComplete
      businessType
    }
  }
`;

const CREATE_BUSINESS_USER = gql`
  mutation CreateBusinessUser($input: CreateUserInput!) {
    createBusinessUser(input: $input) {
      userToken
      user {
        _id
        username
        email
        role
        usageType
        isUserEmailVerified
        isBusinessProfileComplete
      }
    }
  }
`;

const VERIFY_BUSINESS_USER_EMAIL = gql`
  mutation VerifyBusinessUserEmail($email: String!, $code: String!) {
    verifyBusinessUserEmail(email: $email, code: $code) {
      userToken
      user {
        _id
        username
        email
        role
        usageType
        isUserEmailVerified
        isBusinessProfileComplete
      }
    }
  }
`;

const REQUEST_BUSINESS_USER_EMAIL_VERIFICATION = gql`
  mutation RequestBusinessUserEmailVerification($email: String!) {
    requestBusinessUserEmailVerification(email: $email) {
      success
      message
    }
  }
`;

const UPDATE_BUSINESS_USER_PROFILE = gql`
  mutation UpdateBusinessUserProfile($input: BusinessOnboardingInput!) {
    updateBusinessUserProfile(input: $input) {
      success
      message
      email
      verificationCode
    }
  }
`;

const VERIFY_BUSINESS_PHONE = gql`
  mutation VerifyBusinessPhone($email: String!, $code: String!) {
    verifyBusinessPhone(email: $email, code: $code) {
      success
      message
      email
      user {
        _id
        email
        isUserBusinessPhoneVerified
      }
    }
  }
`;

const BUSINESS_TYPES = [
  "Bar, Restaurant or Brewery",
  "Retail",
  "Events",
  "Hotel or Lodging",
  "Fitness Club",
  "Radio",
  "Television",
  "Website or Mobile App",
  "Political Entities",
];

const ELIGIBLE_COUNTRIES = ["USA", "Rwanda"];
const COUNTRY_PHONE_CODES = {
  USA: "+1",
  Rwanda: "+250",
};
const PHONE_NUMBER_PLACEHOLDERS = {
  USA: "5551234567",
  Rwanda: "788456789",
};

const businessTypeToSlug = (businessType) =>
  businessType
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const BusinessLogin = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const userProfile = UserAuth.loggedIn() ? UserAuth.getProfile() : null;
  const loggedInUserEmail = userProfile?.data?.email || "";
  const [useLoggedInEmail, setUseLoggedInEmail] = useState(Boolean(loggedInUserEmail));
  const isLoggedInUser = Boolean(loggedInUserEmail) && useLoggedInEmail;
  const [mode, setMode] = useState("email");
  const [formState, setFormState] = useState({ email: loggedInUserEmail, password: "" });
  const [signupFormState, setSignupFormState] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneVerificationCode, setPhoneVerificationCode] = useState("");
  const [pendingBusinessEmail, setPendingBusinessEmail] = useState("");
  const [businessPassword, setBusinessPassword] = useState("");
  const [businessProfile, setBusinessProfile] = useState({
    businessName: "",
    businessType: "",
    country: "",
    phoneCode: "",
    phoneNumber: "",
    address: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPasswordSignup, setShowPasswordSignup] = useState(false);
  const [message, setMessage] = useState("");
  const [checkBusinessAccount, { loading }] = useLazyQuery(BUSINESS_ACCOUNT_STATUS, {
    fetchPolicy: "network-only",
  });
  const [loginUser, { loading: loggingInBusiness }] = useMutation(LOGIN_USER);
  const [createBusinessUser, { loading: creatingUser }] = useMutation(CREATE_BUSINESS_USER);
  const [verifyBusinessUserEmail, { loading: verifyingEmail }] = useMutation(VERIFY_BUSINESS_USER_EMAIL);
  const [requestBusinessUserEmailVerification, { loading: requestingEmailCode }] = useMutation(REQUEST_BUSINESS_USER_EMAIL_VERIFICATION);
  const [updateBusinessUserProfile, { loading: savingBusinessProfile }] = useMutation(UPDATE_BUSINESS_USER_PROFILE);
  const [verifyBusinessPhone, { loading: verifyingPhone }] = useMutation(VERIFY_BUSINESS_PHONE);

  const heroGradient = `
    radial-gradient(circle at 20% 30%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 25%),
    linear-gradient(to bottom, #0F0F0F, #1A1A1A)
  `;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleSignupChange = (event) => {
    const { name, value } = event.target;
    setSignupFormState((current) => ({ ...current, [name]: value }));
  };

  const handleBusinessProfileChange = (event) => {
    const { name, value } = event.target;
    setBusinessProfile((current) => {
      if (name !== "country") {
        return { ...current, [name]: value };
      }

      const phoneCode = COUNTRY_PHONE_CODES[value] || "";
      const currentPhone = current.phoneNumber.trim();
      const hasKnownCode = Object.values(COUNTRY_PHONE_CODES).some((code) => currentPhone.startsWith(code));

      return {
        ...current,
        country: value,
        phoneCode,
        phoneNumber: hasKnownCode ? currentPhone.replace(phoneCode, "").trim() : current.phoneNumber,
      };
    });
  };

  const moveForward = () => {
    const email = (pendingBusinessEmail || formState.email || signupFormState.email).trim().toLowerCase();
    setPendingBusinessEmail(email);
    setMode("business-profile");
    setMessage("");
  };

  const goToPricingForBusinessType = (businessType) => {
    navigate(`/business/pricing/${businessTypeToSlug(businessType)}`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const email = formState.email.trim().toLowerCase();
    if (!email) {
      setMessage("Email is required.");
      return;
    }

    try {
      const { data } = await checkBusinessAccount({ variables: { email } });
      const status = data?.businessAccountStatus;

      if (status?.exists) {
        if (!status.hasBusinessUsage) {
          setSignupFormState((current) => ({ ...current, email }));
          setMode("signup");
          setMessage("This email is personal. Create business access to continue.");
          return;
        }

        if (!status.isUserEmailVerified) {
          setPendingBusinessEmail(email);
          setEmailCode("");
          setMode("verify-email");
          setMessage("Generating verification code...");
          try {
            await requestBusinessUserEmailVerification({ variables: { email } });
            setMessage("");
          } catch (error) {
            setMessage(error.message || "Unable to send verification code.");
          }
          return;
        }

        if (status.isBusinessProfileComplete) {
          setPendingBusinessEmail(email);
          setMode("business-password");
          return;
        }

        moveForward();
        return;
      }

      setSignupFormState((current) => ({ ...current, email }));
      setMode("signup");
    } catch (error) {
      setMessage(error.message || "Unable to check this email.");
    }
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      if (!signupFormState.username.trim() || !signupFormState.email.trim() || !signupFormState.password) {
        throw new Error("All fields are required");
      }

      if (!agreedToTerms) {
        throw new Error("You must agree to the terms.");
      }

      const email = signupFormState.email.trim().toLowerCase();
      setPendingBusinessEmail(email);
      setMode("verify-email");
      setMessage("Generating verification code...");

      const { data } = await createBusinessUser({
        variables: {
          input: {
            username: signupFormState.username,
            email,
            password: signupFormState.password,
            role: "regular",
          },
        },
      });

      setPendingBusinessEmail(data?.createBusinessUser?.user?.email || email);
      setMessage("");
    } catch (error) {
      setMode("signup");
      setMessage(error.message || "Unable to create this account.");
    }
  };

  const handleVerifyEmailSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      if (!emailCode.trim()) {
        throw new Error("Verification code is required.");
      }

      const { data } = await verifyBusinessUserEmail({
        variables: {
          email: pendingBusinessEmail,
          code: emailCode.trim(),
        },
      });

      const token = data?.verifyBusinessUserEmail?.userToken;
      if (token) {
        localStorage.setItem("user_id_token", token);
        localStorage.setItem("lastLogin", "user");
      }

      const { data: statusData } = await checkBusinessAccount({ variables: { email: pendingBusinessEmail } });
      const status = statusData?.businessAccountStatus;
      if (status?.isBusinessProfileComplete && status?.businessType) {
        goToPricingForBusinessType(status.businessType);
        return;
      }

      moveForward();
    } catch (error) {
      setMessage(error.message || "Unable to verify this email.");
    }
  };

  const handleBusinessPasswordSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      if (!businessPassword) {
        throw new Error("Password is required.");
      }

      const { data } = await loginUser({
        variables: {
          email: pendingBusinessEmail,
          password: businessPassword,
        },
      });

      const token = data?.login?.userToken;
      if (token) {
        localStorage.setItem("user_id_token", token);
        localStorage.setItem("lastLogin", "user");
      }

      const { data: statusData } = await checkBusinessAccount({ variables: { email: pendingBusinessEmail } });
      const status = statusData?.businessAccountStatus;
      if (!status?.hasBusinessUsage) {
        throw new Error("This account is not enabled for business access.");
      }

      if (!status?.isUserEmailVerified) {
        setEmailCode("");
        setMode("verify-email");
        setMessage("Generating verification code...");
        try {
          await requestBusinessUserEmailVerification({ variables: { email: pendingBusinessEmail } });
          setMessage("");
        } catch (error) {
          setMessage(error.message || "Unable to send verification code.");
        }
        return;
      }

      const businessType = status?.businessType;
      if (businessType && status?.isBusinessProfileComplete) {
        goToPricingForBusinessType(businessType);
        return;
      }

      setMode("business-profile");
    } catch (error) {
      setMessage(error.message || "Unable to log in.");
    }
  };

  if (mode === "business-password") {
    return (
      <AuthFormContainer heroGradient={heroGradient} theme={theme}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ textAlign: "center", mb: 3, fontFamily: theme.typography.fontFamily }}>
            <SitemarkIcon sx={{ width: 96, height: 96, mb: 2, alignSelf: "flex-start" }} />
            <Typography variant="h4" sx={{ color: theme.palette.text.primary, fontWeight: 700, fontFamily: theme.typography.fontFamily }}>
              Business Login
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1, fontFamily: theme.typography.fontFamily }}>
              Enter your password to continue.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleBusinessPasswordSubmit}>
            <Box className="form-group" sx={{ mb: 2 }}>
              <Typography component="label" sx={{ display: "block", color: theme.palette.text.secondary, mb: 1, fontSize: 14 }}>
                Business email:
              </Typography>
              <Box component="input" value={pendingBusinessEmail} readOnly sx={{ width: "100%", padding: "12px 15px", borderRadius: "8px", border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, background: "rgba(255,255,255,0.08)", color: theme.palette.text.primary, fontSize: 16, fontFamily: theme.typography.fontFamily }} />
            </Box>

            <Box className="form-group" sx={{ mb: 2.5 }}>
              <Typography component="label" htmlFor="businessPassword" sx={{ display: "block", color: theme.palette.text.secondary, mb: 1, fontSize: 14 }}>
                Password:
              </Typography>
              <Box component="input" id="businessPassword" type="password" value={businessPassword} onChange={(event) => setBusinessPassword(event.target.value)} required sx={{ width: "100%", padding: "12px 15px", borderRadius: "8px", border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, background: "rgba(255,255,255,0.05)", color: theme.palette.text.primary, fontSize: 16, fontFamily: theme.typography.fontFamily }} />
            </Box>

            {message && (
              <Typography sx={{ color: "#FF4D4D", mb: 1.5, fontSize: 14, textAlign: "center" }}>
                {message}
              </Typography>
            )}

            <Box component="button" type="submit" sx={{ width: "100%", padding: "14px", borderRadius: "8px", background: "linear-gradient(90deg, #E4C421, #B25035)", color: "#000", border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "all 0.3s ease", mb: 2, "&:hover": { background: "linear-gradient(90deg, #F8D347, #C96146)", transform: "translateY(-2px)" } }}>
              {loggingInBusiness ? "Logging in..." : "Continue"}
            </Box>
          </Box>
        </Box>
      </AuthFormContainer>
    );
  }

  const handleBusinessProfileSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      if (
        !businessProfile.businessName.trim() ||
        !businessProfile.businessType ||
        !businessProfile.country ||
        !businessProfile.phoneCode ||
        !businessProfile.phoneNumber.trim() ||
        !businessProfile.address.trim()
      ) {
        throw new Error("All business profile fields are required.");
      }

      await updateBusinessUserProfile({
        variables: {
          input: {
            email: pendingBusinessEmail,
            businessName: businessProfile.businessName,
            businessType: businessProfile.businessType,
            country: businessProfile.country,
            phoneNumber: `${businessProfile.phoneCode}${businessProfile.phoneNumber.trim()}`,
            address: businessProfile.address,
          },
        },
      });

      navigate(`/business/pricing/${businessTypeToSlug(businessProfile.businessType)}`);
    } catch (error) {
      setMessage(error.message || "Unable to save business profile.");
    }
  };

  const handleVerifyPhoneSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      if (!phoneCode.trim()) {
        throw new Error("Phone verification code is required.");
      }

      await verifyBusinessPhone({
        variables: {
          email: pendingBusinessEmail,
          code: phoneCode.trim(),
        },
      });

      setMessage("Business phone verified.");
    } catch (error) {
      setMessage(error.message || "Unable to verify this phone number.");
    }
  };

  if (mode === "verify-phone") {
    return (
      <AuthFormContainer heroGradient={heroGradient} theme={theme}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ textAlign: "center", mb: 3, fontFamily: theme.typography.fontFamily }}>
            <SitemarkIcon sx={{ width: 96, height: 96, mb: 2, alignSelf: "flex-start" }} />
            <Typography variant="h4" sx={{ color: theme.palette.text.primary, fontWeight: 700, fontFamily: theme.typography.fontFamily }}>
              Verify Phone Number
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1, fontFamily: theme.typography.fontFamily }}>
              Enter the code for {businessProfile.phoneCode}{businessProfile.phoneNumber}.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleVerifyPhoneSubmit}>
            {phoneVerificationCode && (
              <Typography sx={{ color: theme.palette.primary.main, mb: 1.5, fontSize: 14, textAlign: "center", fontWeight: 700 }}>
                Verification code: {phoneVerificationCode}
              </Typography>
            )}

            <Box className="form-group" sx={{ mb: 2.5 }}>
              <Typography component="label" htmlFor="phoneCode" sx={{ display: "block", color: theme.palette.text.secondary, mb: 1, fontSize: 14 }}>
                Phone verification code:
              </Typography>
              <Box
                component="input"
                id="phoneCode"
                name="phoneCode"
                inputMode="numeric"
                value={phoneCode}
                onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                sx={{
                  width: "100%",
                  padding: "12px 15px",
                  borderRadius: "8px",
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  background: "rgba(255,255,255,0.05)",
                  color: theme.palette.text.primary,
                  fontSize: 16,
                  fontFamily: theme.typography.fontFamily,
                }}
              />
            </Box>

            {message && (
              <Typography sx={{ color: message.includes("verified") ? theme.palette.primary.main : "#FF4D4D", mb: 1.5, fontSize: 14, textAlign: "center" }}>
                {message}
              </Typography>
            )}

            <Box component="button" type="submit" sx={{ width: "100%", padding: "14px", borderRadius: "8px", background: "linear-gradient(90deg, #E4C421, #B25035)", color: "#000", border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "all 0.3s ease", mb: 2, "&:hover": { background: "linear-gradient(90deg, #F8D347, #C96146)", transform: "translateY(-2px)" } }}>
              {verifyingPhone ? "Verifying..." : "Verify"}
            </Box>
          </Box>
        </Box>
      </AuthFormContainer>
    );
  }

  if (mode === "business-profile") {
    return (
      <AuthFormContainer heroGradient={heroGradient} theme={theme}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ textAlign: "center", mb: 3, fontFamily: theme.typography.fontFamily }}>
            <SitemarkIcon sx={{ width: 96, height: 96, mb: 2, alignSelf: "flex-start" }} />
            <Typography variant="h4" sx={{ color: theme.palette.text.primary, fontWeight: 700, fontFamily: theme.typography.fontFamily }}>
              Business Profile
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1, fontFamily: theme.typography.fontFamily }}>
              Licensing is currently available in USA and Rwanda.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleBusinessProfileSubmit}>
            <Box className="form-group" sx={{ mb: 2 }}>
              <Typography component="label" htmlFor="businessName" sx={{ display: "block", color: theme.palette.text.secondary, mb: 1, fontSize: 14 }}>
                Business name:
              </Typography>
              <Box
                component="input"
                id="businessName"
                name="businessName"
                type="text"
                value={businessProfile.businessName}
                onChange={handleBusinessProfileChange}
                required
                sx={{
                  width: "100%",
                  padding: "12px 15px",
                  borderRadius: "8px",
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  background: "rgba(255,255,255,0.05)",
                  color: theme.palette.text.primary,
                  fontSize: 16,
                  fontFamily: theme.typography.fontFamily,
                }}
              />
            </Box>

            <Box className="form-group" sx={{ mb: 2 }}>
              <Typography component="label" htmlFor="businessType" sx={{ display: "block", color: theme.palette.text.secondary, mb: 1, fontSize: 14 }}>
                Business type:
              </Typography>
              <Box component="select" id="businessType" name="businessType" value={businessProfile.businessType} onChange={handleBusinessProfileChange} required sx={{ width: "100%", padding: "12px 15px", borderRadius: "8px", border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, background: "rgba(255,255,255,0.05)", color: theme.palette.text.primary, fontSize: 16, fontFamily: theme.typography.fontFamily }}>
                <Box component="option" value="">Select business type</Box>
                {BUSINESS_TYPES.map((type) => (
                  <Box component="option" value={type} key={type}>{type}</Box>
                ))}
              </Box>
            </Box>

            <Box className="form-group" sx={{ mb: 2 }}>
              <Typography component="label" htmlFor="country" sx={{ display: "block", color: theme.palette.text.secondary, mb: 1, fontSize: 14 }}>
                Country:
              </Typography>
              <Box component="select" id="country" name="country" value={businessProfile.country} onChange={handleBusinessProfileChange} required sx={{ width: "100%", padding: "12px 15px", borderRadius: "8px", border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, background: "rgba(255,255,255,0.05)", color: theme.palette.text.primary, fontSize: 16, fontFamily: theme.typography.fontFamily }}>
                <Box component="option" value="">Select country</Box>
                {ELIGIBLE_COUNTRIES.map((country) => (
                  <Box component="option" value={country} key={country}>{country}</Box>
                ))}
              </Box>
            </Box>

            <Box className="form-group" sx={{ mb: 2 }}>
              <Typography component="label" htmlFor="phoneNumber" sx={{ display: "block", color: theme.palette.text.secondary, mb: 1, fontSize: 14 }}>
                Phone number:
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "84px 1fr", gap: 1 }}>
                <Box
                  component="input"
                  aria-label="Country phone code"
                  value={businessProfile.phoneCode}
                  readOnly
                  sx={{
                    width: "100%",
                    padding: "12px 15px",
                    borderRadius: "8px",
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: "rgba(255,255,255,0.08)",
                    color: theme.palette.text.primary,
                    fontSize: 16,
                    fontFamily: theme.typography.fontFamily,
                    textAlign: "center",
                  }}
                />
                <Box
                  component="input"
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={businessProfile.phoneNumber}
                  placeholder={PHONE_NUMBER_PLACEHOLDERS[businessProfile.country] || ""}
                  onChange={handleBusinessProfileChange}
                  required
                  sx={{
                    width: "100%",
                    padding: "12px 15px",
                    borderRadius: "8px",
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: "rgba(255,255,255,0.05)",
                    color: theme.palette.text.primary,
                    fontSize: 16,
                    fontFamily: theme.typography.fontFamily,
                  }}
                />
              </Box>
            </Box>

            <Box className="form-group" sx={{ mb: 2 }}>
              <Typography component="label" htmlFor="address" sx={{ display: "block", color: theme.palette.text.secondary, mb: 1, fontSize: 14 }}>
                Address:
              </Typography>
              <Box component="textarea" id="address" name="address" value={businessProfile.address} onChange={handleBusinessProfileChange} required rows={3} sx={{ width: "100%", padding: "12px 15px", borderRadius: "8px", border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, background: "rgba(255,255,255,0.05)", color: theme.palette.text.primary, fontSize: 16, fontFamily: theme.typography.fontFamily, resize: "vertical" }} />
            </Box>

            {message && (
              <Typography sx={{ color: message.includes("saved") ? theme.palette.primary.main : "#FF4D4D", mb: 1.5, fontSize: 14, textAlign: "center" }}>
                {message}
              </Typography>
            )}

            <Box component="button" type="submit" sx={{ width: "100%", padding: "14px", borderRadius: "8px", background: "linear-gradient(90deg, #E4C421, #B25035)", color: "#000", border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "all 0.3s ease", mb: 2, "&:hover": { background: "linear-gradient(90deg, #F8D347, #C96146)", transform: "translateY(-2px)" } }}>
              {savingBusinessProfile ? "Saving..." : "Continue"}
            </Box>
          </Box>
        </Box>
      </AuthFormContainer>
    );
  }

  if (mode === "verify-email") {
    return (
      <AuthFormContainer heroGradient={heroGradient} theme={theme}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ textAlign: "center", mb: 3, fontFamily: theme.typography.fontFamily }}>
            <SitemarkIcon sx={{ width: 96, height: 96, mb: 2, alignSelf: "flex-start" }} />
            <Typography variant="h4" sx={{ color: theme.palette.text.primary, fontWeight: 700, fontFamily: theme.typography.fontFamily }}>
              Verify Business Email
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1, fontFamily: theme.typography.fontFamily }}>
              Enter the 4-digit code sent to {pendingBusinessEmail}.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleVerifyEmailSubmit}>
            <Box className="form-group" sx={{ mb: 2.5 }}>
              <Typography component="label" htmlFor="emailCode" sx={{ display: "block", color: theme.palette.text.secondary, mb: 1, fontSize: 14 }}>
                Verification code:
              </Typography>
              <Box
                component="input"
                id="emailCode"
                name="emailCode"
                inputMode="numeric"
                maxLength={4}
                value={emailCode}
                onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
                required
                sx={{
                  width: "100%",
                  padding: "12px 15px",
                  borderRadius: "8px",
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  background: "rgba(255,255,255,0.05)",
                  color: theme.palette.text.primary,
                  fontSize: "16px",
                  fontFamily: theme.typography.fontFamily,
                }}
              />
            </Box>

            {message && (
              <Typography sx={{ color: message.includes("Generating") ? theme.palette.primary.main : "#FF4D4D", mb: 1.5, fontSize: 14, textAlign: "center" }}>
                {message}
              </Typography>
            )}

            <Box component="button" type="submit" disabled={creatingUser || requestingEmailCode} sx={{ width: "100%", padding: "14px", borderRadius: "8px", background: "linear-gradient(90deg, #E4C421, #B25035)", color: "#000", border: "none", fontSize: 16, fontWeight: 600, cursor: creatingUser || requestingEmailCode ? "not-allowed" : "pointer", opacity: creatingUser || requestingEmailCode ? 0.7 : 1, transition: "all 0.3s ease", mb: 2, "&:hover": { background: "linear-gradient(90deg, #F8D347, #C96146)", transform: creatingUser || requestingEmailCode ? "none" : "translateY(-2px)" } }}>
              {creatingUser || requestingEmailCode ? "Sending code..." : verifyingEmail ? "Verifying..." : "Verify"}
            </Box>

            <Box component="button" type="button" onClick={() => navigate("/business/licensing/overview")} sx={{ background: "none", border: "none", color: theme.palette.text.primary, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mx: "auto", ":hover": { color: "#E4C421" } }}>
              Cancel
            </Box>
          </Box>
        </Box>
      </AuthFormContainer>
    );
  }

  if (mode === "signup") {
    return (
      <SignupForm
        heroGradient={heroGradient}
        theme={theme}
        signupFormState={signupFormState}
        handleSignupChange={handleSignupChange}
        handleSignupSubmit={handleSignupSubmit}
        agreedToTerms={agreedToTerms}
        setAgreedToTerms={setAgreedToTerms}
        showPasswordSignup={showPasswordSignup}
        toggleShowPasswordSignup={() => setShowPasswordSignup((current) => !current)}
        signupErrorMessage={message}
        title="Create Business Account"
        subtitle="Add the required user details to continue."
        submitLabel={creatingUser ? "Creating..." : "Continue"}
        usernameLabel="Company representative:"
        emailLabel="Business email:"
        onSwitchToLogin={() => setMode("email")}
        onBackHome={() => navigate("/business/licensing/overview")}
        showLoginPrompt={false}
        backHomeLabel="Cancel"
      />
    );
  }

  return (
    <LoginForm
      heroGradient={heroGradient}
      theme={theme}
      loginFormState={formState}
      handleLoginChange={handleChange}
      handleLoginSubmit={handleSubmit}
      handleGoogleLogin={() => {}}
      showPasswordLogin={false}
      toggleShowPasswordLogin={() => {}}
      loginErrorMessage={message}
      title="Business Login"
      subtitle={isLoggedInUser ? "Continue business setup with your personal account email." : "Continue with your business account."}
      submitLabel={isLoggedInUser ? "Yes" : loading ? "Checking..." : "Continue"}
      secondaryActionLabel={isLoggedInUser ? "No" : undefined}
      onSecondaryAction={() => {
        setUseLoggedInEmail(false);
        setSignupFormState((current) => ({ ...current, email: "" }));
        setMode("signup");
        setMessage("");
      }}
      emailLabel={isLoggedInUser ? "Use this email?" : "What is your email?"}
      emailReadOnly={isLoggedInUser}
      onForgotPassword={() => {}}
      onSwitchToSignup={() => {}}
      onBackHome={() => navigate("/business/licensing/overview")}
      showSignupPrompt={false}
      showPasswordField={false}
      showForgotPassword={false}
      backHomeLabel="Cancel"
    />
  );
};

export default BusinessLogin;
