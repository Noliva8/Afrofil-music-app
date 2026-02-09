import React, { useMemo, useState } from "react";

import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Accordion from '@mui/material/Accordion';
import Typography from "@mui/material/Typography";
import Divider from '@mui/material/Divider';
import useMediaQuery from '@mui/material/useMediaQuery';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import  TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import Alert from '@mui/material/Alert';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';




const TERMS_META = {
  appName: "Afrofeel",
  operator: "D Record Media LLC",
  registeredState: "Arizona, United States",
  lastUpdated: "February 4, 2026",
  effectiveDate: "February 4, 2026",
  serviceProviderAddress: "[Insert business address, Arizona, USA]",
  legalEmail: "legal@afrofeel.com",
  supportEmail: "support@afrofeel.com",
  minAge: 13,
  arbitrationEnabled: true,
  arbitrationProvider: "AAA or NAM (choose one with counsel)",
  arbitrationVenue: "Maricopa County, Arizona (or county of user residence if required)",
};





const Section = ({ children }) => (
  <Box component="div" sx={{ "& p": { mb: 1.4, lineHeight: 1.6 } }}>
    {children}
  </Box>
);

const TERMS_SECTIONS = [
  {
    id: "intro",
    title: "Introduction",
    body: (
      <Section>
        <Typography component="p">
          Please read these Terms of Use ("Terms") carefully. They govern your use of (including access to) <b>{TERMS_META.appName}</b> and any websites, mobile applications, software, and related services that link to these Terms (collectively, the "Service"), as well as any music, audio, videos, artwork, metadata, text, and other materials made available through the Service ("Content").
        </Typography>

        <Typography component="p">
          These Terms incorporate by reference any additional policies and guidelines we present (collectively, the "Agreements"), including our Privacy Policy, Community Guidelines, and Artist Upload Policy (if applicable).
        </Typography>

        <Typography component="p">
          By creating an account, accessing, or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
        </Typography>

        {TERMS_META.arbitrationEnabled && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            <Typography fontWeight={800}>
              IMPORTANT: THESE TERMS CONTAIN A DISPUTE RESOLUTION AND ARBITRATION PROVISION.
            </Typography>
            <Typography variant="body2">
              Where permitted by law, disputes may be resolved by binding individual arbitration rather than in court, and class actions may be waived. See "Problems and Disputes".
            </Typography>
          </Alert>
        )}
      </Section>
    ),
  },
  {
    id: "service-provider",
    title: "Service Provider",
    body: (
      <Section>
        <Typography component="p">
          These Terms are between you and <b>{TERMS_META.operator}</b> ("we", "us", "our"), registered in <b>{TERMS_META.registeredState}</b>.
        </Typography>
        <Typography component="p">
          Address: {TERMS_META.serviceProviderAddress}
          <br />
          Legal: <b>{TERMS_META.legalEmail}</b>
          <br />
          Support: <b>{TERMS_META.supportEmail}</b>
        </Typography>
      </Section>
    ),
  },
  {
    id: "age-eligibility",
    title: "Age and Eligibility Requirements",
    body: (
      <Section>
        <Typography component="p">
          By using the Service, you affirm that you are at least <b>{TERMS_META.minAge}</b> years old. If you are under 18, you represent that you have obtained parental or guardian consent to use the Service and to agree to these Terms, where required by law.
        </Typography>
        <Typography component="p">
          You agree that your registration and account information is accurate and complete and that you will keep it up to date.
        </Typography>
        <Typography component="p">
          We may refuse, suspend, or terminate access if we reasonably believe you do not meet eligibility requirements or your account information is inaccurate.
        </Typography>
      </Section>
    ),
  },
  {
    id: "service-options",
    title: "The Afrofeel Service Provided by Us",
    body: (
      <Section>
        <Typography component="p">
          We provide multiple Service options. Some features may be free, while others require payment ("Paid Subscriptions"). We may also offer promotional plans, trials, or third-party products and services.
        </Typography>

        <Typography component="p">
          <b>Trials.</b> If you start a trial, your use may be subject to additional trial terms shown at sign-up. Unless canceled before the trial ends, your trial may convert to a paid plan and you authorize us (or our payment processor) to charge your payment method.
        </Typography>

        <Typography component="p">
          <b>Third-party apps and devices.</b> The Service may integrate with third-party applications and devices. Your use of third-party apps/devices may be governed by their terms, and we do not guarantee compatibility.
        </Typography>

        <Typography component="p">
          <b>Service limitations and modifications.</b> We may change, suspend, or discontinue all or part of the Service (including features, content availability, and plans) at any time. Content availability may change due to licensing, policy, or legal reasons.
        </Typography>
      </Section>
    ),
  },
  {
    id: "accounts-security",
    title: "Your Use of the Service",
    body: (
      <Section>
        <Typography component="p">
          <b>Creating an account.</b> You may need an account to access features. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.
        </Typography>
        <Typography component="p">
          Notify us immediately if you believe your account has been compromised.
        </Typography>

        <Typography component="p">
          <b>Your rights to use the Service.</b> Subject to these Terms, we grant you a limited, non-exclusive, revocable, non-transferable license to access and use the Service and Content for personal, non-commercial use only, unless we expressly allow otherwise in writing.
        </Typography>

        <Typography component="p">
          You agree not to redistribute, sell, sublicense, rent, or otherwise exploit the Service or Content except as permitted by the Agreements.
        </Typography>
      </Section>
    ),
  },
  {
    id: "payments-cancellation",
    title: "Payments and Cancellation",
    body: (
      <Section>
        <Typography component="p">
          If you purchase a Paid Subscription, you agree to pay applicable fees and taxes. Paid Subscriptions may renew automatically unless canceled.
        </Typography>

        <Typography component="p">
          <b>Billing.</b> Unless otherwise stated, recurring subscriptions are billed in advance on a repeating basis. You authorize us (or our payment processor) to charge your payment method for recurring fees and applicable taxes.
        </Typography>

        <Typography component="p">
          <b>Cancellation.</b> You may cancel at any time through your account settings. Cancellation generally takes effect at the end of the current billing period unless required otherwise by applicable law. Unless required by law or expressly stated in a plan, we do not provide refunds or credits for partial periods.
        </Typography>

        <Typography component="p">
          <b>Price changes.</b> We may change pricing with advance notice as required by law. If you do not agree, you can cancel before the new price takes effect.
        </Typography>
      </Section>
    ),
  },
  {
    id: "user-guidelines",
    title: "User Guidelines",
    body: (
      <Section>
        <Typography component="p">
          You must comply with our Community Guidelines and all applicable laws. You agree not to:
        </Typography>
        <Typography component="div" sx={{ pl: 2 }}>
          <ul style={{ marginTop: 4, marginBottom: 16 }}>
            <li>Upload illegal, hateful, abusive, or infringing content</li>
            <li>Harass, threaten, or impersonate others</li>
            <li>Attempt to disrupt the Service or bypass security</li>
            <li>Scrape, reverse engineer, or use bots except where explicitly allowed</li>
          </ul>
        </Typography>
        <Typography component="p">
          We may remove content or suspend/terminate accounts for violations, repeated complaints, or legal compliance needs.
        </Typography>
      </Section>
    ),
  },
  {
    id: "content-ip",
    title: "Content and Intellectual Property Rights",
    body: (
      <Section>
        <Typography component="p">
          <b>Our IP.</b> The Service, software, and branding are owned by {TERMS_META.operator} and/or licensors and are protected by intellectual property laws. Except for the limited license granted to you, no rights are transferred.
        </Typography>

        <Typography component="p">
          <b>User Content.</b> Users and artists may upload or submit content ("User Content"). You are solely responsible for your User Content and represent that you have all rights needed to upload and make it available.
        </Typography>

        <Typography component="p">
          <b>License you grant to us.</b> To operate the Service, you grant {TERMS_META.operator} a non-exclusive, worldwide, royalty-free license to host, store, reproduce, distribute, stream, publicly perform, display, and otherwise use your User Content for Service operation, personalization, promotion, and delivery, while it remains on the Service. This license ends when you remove the content, subject to reasonable backup/cache retention.
        </Typography>

        <Typography component="p">
          <b>Artist uploads: ownership + non-exclusive distribution.</b> Artists retain ownership and can distribute the same content on other platforms.
        </Typography>

        <Typography component="p">
          <b>Credits requirement.</b> Artists must acknowledge and credit all participants (e.g., featured artists, producers, writers) during upload where the Service provides credit fields.
        </Typography>
      </Section>
    ),
  },
  {
    id: "copyright-claims",
    title: "Infringement Claims and Repeat Violations",
    body: (
      <Section>
        <Typography component="p">
          We respect intellectual property rights. If you believe content infringes your rights, contact us at <b>{TERMS_META.legalEmail}</b> with sufficient detail to identify the work and the allegedly infringing material.
        </Typography>

        <Typography component="p">
          <b>Repeat infringer policy.</b> We may remove content and suspend/terminate accounts for repeated verified infringement claims. As a baseline, accounts may be blocked after more than <b>3</b> verified infringement reports (or fewer where required by law/policy).
        </Typography>

        <Typography component="p">
          Artists are solely responsible for ensuring they have all necessary rights (copyright, samples, permissions, distribution authority). Liability for infringement rests with the uploader to the extent permitted by law.
        </Typography>
      </Section>
    ),
  },
  {
    id: "privacy-data",
    title: "Privacy and Data (Summary)",
    body: (
      <Section>
        <Typography component="p">
          We collect and use data as described in our Privacy Policy, including approximate location data to personalize ads and recommendations. We do not sell personal data. We may share aggregated, de-identified analytics.
        </Typography>
        <Typography component="p">
          For full details (categories, purposes, retention, and user rights), see the Afrofeel Privacy Policy.
        </Typography>
      </Section>
    ),
  },
  {
    id: "support",
    title: "Customer Support, Information, Questions, and Complaints",
    body: (
      <Section>
        <Typography component="p">
          For support, contact <b>{TERMS_META.supportEmail}</b>. For legal/IP notices, contact <b>{TERMS_META.legalEmail}</b>.
        </Typography>
        <Typography component="p">
          We may provide a support community or help center. Participation may be governed by additional rules.
        </Typography>
      </Section>
    ),
  },
  {
    id: "disputes",
    title: "Problems and Disputes",
    body: (
      <Section>
        <Typography component="p">
          <b>Suspension/termination.</b> We may suspend or terminate access if we reasonably believe you violated these Terms, if necessary to comply with law, or if we discontinue the Service. You may stop using the Service at any time.
        </Typography>

        <Typography component="p">
          <b>Warranty disclaimer.</b> The Service is provided "as is" and "as available" without warranties of any kind, to the fullest extent permitted by law.
        </Typography>

        <Typography component="p">
          <b>Limitation of liability.</b> To the fullest extent permitted by law, {TERMS_META.operator} is not liable for indirect, incidental, special, consequential, or punitive damages, or loss of profits, data, or goodwill.
        </Typography>

        <Typography component="p">
          <b>Time limit to bring claims.</b> To the extent permitted by law, any claim must be brought within <b>one (1) year</b> after the events giving rise to the claim.
        </Typography>

        {TERMS_META.arbitrationEnabled ? (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography component="p" fontWeight={900}>
              Arbitration Agreement (Individual Basis)
            </Typography>

            <Typography component="p">
              You and {TERMS_META.operator} agree that disputes arising out of or related to these Terms or the Service will be resolved by binding individual arbitration, not in court, except for: (1) small claims court matters; (2) requests for temporary injunctive relief; and (3) intellectual property disputes where a court has exclusive authority under applicable law.
            </Typography>

            <Typography component="p">
              <b>No class actions.</b> You and we agree to bring claims only in an individual capacity and not as a plaintiff or class member in any purported class, collective, representative, or private attorney general proceeding.
            </Typography>

            <Typography component="p">
              <b>Pre-arbitration notice.</b> Before initiating arbitration, the complaining party must send a written notice describing the dispute and requested relief to <b>{TERMS_META.legalEmail}</b> and allow at least <b>60 days</b> for good-faith informal resolution.
            </Typography>

            <Typography component="p">
              <b>Arbitration provider and venue.</b> Arbitration will be administered by <b>{TERMS_META.arbitrationProvider}</b> under its applicable rules, with hearings by video/phone where possible. Venue will be <b>{TERMS_META.arbitrationVenue}</b> unless required otherwise by law.
            </Typography>

            <Typography component="p">
              <b>Fees.</b> Fees will be allocated as required by the administrator's rules and applicable law. We intend arbitration to be cost-effective.
            </Typography>
          </>
        ) : (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography component="p">
              <b>Governing law and venue.</b> These Terms are governed by Arizona law (excluding conflict-of-laws rules). Disputes will be brought in state or federal courts located in Arizona, and you consent to personal jurisdiction there.
            </Typography>
          </>
        )}
      </Section>
    ),
  },
  {
    id: "about",
    title: "About These Terms",
    body: (
      <Section>
        <Typography component="p">
          <b>Changes.</b> We may update these Terms by posting the revised version and/or providing additional notice (e.g., in-app). Continued use after changes become effective constitutes acceptance.
        </Typography>

        <Typography component="p">
          <b>Entire agreement.</b> These Terms and incorporated policies are the entire agreement between you and {TERMS_META.operator} regarding the Service.
        </Typography>

        <Typography component="p">
          <b>Severability.</b> If any provision is found unenforceable, the remaining provisions remain in effect.
        </Typography>

        <Typography component="p">
          <b>Assignment.</b> We may assign these Terms as part of a merger, acquisition, reorganization, or sale of assets. You may not assign your rights without our consent.
        </Typography>
      </Section>
    ),
  },
];



export default function Terms() {
  const isSmDown = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(TERMS_SECTIONS[0]?.id || false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TERMS_SECTIONS;
    return TERMS_SECTIONS.filter((s) => s.title.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  }, [query]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setExpanded(id);
  };

  const copyLink = async (id) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }
  };

  return (
    <Box sx={{ py: { xs: 2, md: 4 } }}>
      <Container >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            border: (t) => `1px solid ${t.palette.divider}`,
          }}
        >
          <Stack spacing={1.2}>
            <Typography variant={isSmDown ? "h5" : "h4"} fontWeight={900}>
              {TERMS_META.appName} Terms of Use
            </Typography>

            <Typography variant="body2" color="text.secondary">
              <b>Operator:</b> {TERMS_META.operator} • <b>Registered:</b> {TERMS_META.registeredState}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip size="small" label={`Effective: ${TERMS_META.effectiveDate}`} />
              <Chip size="small" label={`Last Updated: ${TERMS_META.lastUpdated}`} variant="outlined" />
              <Chip size="small" label={`Arbitration: ${TERMS_META.arbitrationEnabled ? "Enabled" : "Disabled"}`} variant="outlined" />
            </Stack>

            <Divider sx={{ my: 2 }} />

            <TextField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sections (e.g., disputes, payments, copyright)…"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" fontWeight={900}>
              Table of Contents
            </Typography>

            <List dense disablePadding sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 2 }}>
              {TERMS_SECTIONS.map((s, idx) => (
                <React.Fragment key={s.id}>
                  <ListItemButton onClick={() => scrollTo(s.id)}>
                    <ListItemText primary={s.title} />
                  </ListItemButton>
                  {idx !== TERMS_SECTIONS.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            <Divider sx={{ my: 3 }} />

            <Stack spacing={1.5}>
              {filtered.length === 0 ? (
                <Typography color="text.secondary">No matching sections for "{query}".</Typography>
              ) : (
                filtered.map((s, idx) => (
                  <Box key={s.id} id={s.id} sx={{ scrollMarginTop: 96 }}>
                    <Accordion
                      disableGutters
                      elevation={0}
                      expanded={expanded === s.id}
                      onChange={() => setExpanded((prev) => (prev === s.id ? false : s.id))}
                      sx={{
                        borderRadius: 2,
                        border: (t) => `1px solid ${t.palette.divider}`,
                        "&:before": { display: "none" },
                        overflow: "hidden",
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          sx={{ width: "100%" }}
                        >
                          <Typography fontWeight={900}>{s.title}</Typography>
                          <Chip size="small" label={`Section ${idx + 1}`} variant="outlined" />
                        </Stack>
                      </AccordionSummary>

                      <AccordionDetails>{s.body}</AccordionDetails>
                    </Accordion>
                  </Box>
                ))
              )}
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Alert severity="info">
              This page is a starting template modeled after common streaming-platform structures. Before publishing, have counsel confirm arbitration choice, billing language, DMCA process, and AZ/U.S. consumer law compliance.
            </Alert>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
