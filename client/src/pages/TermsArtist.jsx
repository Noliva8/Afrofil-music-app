

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import useTheme from '@mui/material/styles/useTheme';
import useMediaQuery from '@mui/material/useMediaQuery';




export default function TermsArtist() {

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));


  return (

<>

<Container
  maxWidth="md"
  sx={{ py: 4, px: isMobile ? 2 : 4 }}
>

<Typography
  variant="h4"
  gutterBottom
  align={isMobile ? "center" : "left"}
  sx={{
    fontFamily: theme.typography.fontFamily,
    fontWeight: "bold",
    color: theme.palette.text.primary
  }}
>
  Flolup Artist Agreement
</Typography>

<Typography variant="body1" gutterBottom>
Welcome to <span style={{ fontWeight: "bold" }}>Flolup</span>.
This Artist Agreement governs the relationship between DRecord Media LLC and Dream record ltd
("Flolup", "we", "our", "us") and any artist, label, manager, rights holder,
or representative ("Artist", "you", "your") who creates an artist account or uploads content to Flolup.

By creating an account or uploading content to Flolup, you acknowledge that you have read, understood, and agree to this Agreement. If you do not agree with these terms, you should not create an account or use our services.
</Typography>

{/* ARTICLE 1 */}

<Typography
variant="h5"
gutterBottom
sx={{
mt:4,
mb:2,
fontFamily: theme.typography.fontFamily,
fontWeight:"bold",
color:theme.palette.text.primary
}}
>
1. Eligibility and Account Registration
</Typography>

<Typography variant="body1" gutterBottom>
To create an artist account on Flolup, you must provide accurate and complete information during registration.

You are responsible for:

<br />
<br />

• Maintaining account security
<br />
• Protecting login credentials
<br />
• All activity occurring under your account
<br />
• Immediately notifying Flolup regarding unauthorized access

<br />
<br />

You represent that:

<br />
<br />

• You are at least eighteen (18) years old; or
<br />
• You have authorization from a parent or legal guardian

<br />
<br />

Flolup reserves the right to suspend, reject, or terminate accounts involved in fraud, abuse, or violation of this Agreement.
</Typography>

{/* ARTICLE 2 */}

<Typography
variant="h5"
gutterBottom
sx={{
mt:4,
mb:2,
fontFamily: theme.typography.fontFamily,
fontWeight:"bold",
color:theme.palette.text.primary
}}
>
2. Ownership of Content
</Typography>

<Typography variant="body1" gutterBottom>

You retain ownership of all rights to your submitted content including:

<br />
<br />

• Songs
<br />
• Audio recordings
<br />
• Lyrics
<br />
• Album artwork
<br />
• Images
<br />
• Videos
<br />
• Metadata
<br />
• Promotional materials

<br />
<br />

Nothing in this Agreement transfers ownership of your content to Flolup.
</Typography>


{/* ARTICLE 3 */}

<Typography
variant="h5"
gutterBottom
sx={{
mt:4,
mb:2,
fontFamily: theme.typography.fontFamily,
fontWeight:"bold",
color:theme.palette.text.primary
}}
>
3. License Granted To Flolup
</Typography>

<Typography variant="body1" gutterBottom>

By uploading content to Flolup, you grant Flolup a worldwide, non-exclusive, revocable license to:

<br />
<br />

• Host content
<br />
• Store content
<br />
• Stream content
<br />
• Encode and transcode files
<br />
• Create previews and snippets
<br />
• Display artwork
<br />
• Promote content
<br />
• Distribute content through services you participate in
<br />
• Operate and improve platform services

<br />
<br />

This license exists solely for operating Flolup services and does not transfer ownership to Flolup.

You may terminate this license by removing content from the platform, except where copies already distributed or legally required records remain.
</Typography>


{/* ARTICLE 4 */}

<Typography
variant="h5"
gutterBottom
sx={{
mt:4,
mb:2,
fontFamily: theme.typography.fontFamily,
fontWeight:"bold",
color:theme.palette.text.primary
}}
>
4. Artist Representations and Warranties
</Typography>

<Typography variant="body1" gutterBottom>

You represent and warrant that:

<br />
<br />

• You own or control all required rights for uploaded content
<br />
• Your content does not violate intellectual property rights
<br />
• Your content does not contain illegal material
<br />
• Your content does not contain malware
<br />
• You have permission from all collaborators, writers, producers, and featured artists

<br />
<br />

You are solely responsible for all uploaded content.
</Typography>


{/* ARTICLE 5 */}

<Typography
variant="h5"
gutterBottom
sx={{
mt:4,
mb:2,
fontFamily: theme.typography.fontFamily,
fontWeight:"bold",
color:theme.palette.text.primary
}}
>
5. Flolup Services
</Typography>


<Typography variant="body1" gutterBottom>

Flolup may provide services including:

</Typography>


<br />

<Typography variant="body1" gutterBottom>

5.1 Music Streaming

<br />
<br />

Your music may:

<br />
<br />

• Be streamed by users
<br />
• Be included in playlists
<br />
• Be recommended to users
<br />
• Be promoted through campaigns

<br />
<br />

Flolup may offer:

<br />
<br />

• Free plans
<br />
• Premium subscriptions
<br />
• Future subscription services

<br />
<br />

Revenue from free services may come from advertising and sponsorships.

Flolup does not guarantee advertising availability or guaranteed earnings.

Premium revenue sharing calculations may vary according to platform policies.
</Typography>


<br />

<Typography variant="body1" gutterBottom>

5.2 Public Performance Licensing

<br />
<br />

Flolup may provide music licensing services for businesses and venues.

Participation in this service may require:

<br />
<br />

• Additional consent
<br />
• Rights verification
<br />
• Additional agreements

<br />
<br />

Flolup does not guarantee licensing opportunities or earnings.
</Typography>


<br />

<Typography variant="body1" gutterBottom>

5.3 Music Distribution

<br />
<br />

Flolup may provide music distribution services to third-party platforms including:

<br />
<br />

• Spotify
<br />
• Apple Music
<br />
• Amazon Music
<br />
• Other partner platforms

<br />
<br />

Distribution services:

<br />
<br />

• May require additional approval
<br />
• May involve fees
<br />
• May require additional agreements

<br />
<br />

Flolup does not guarantee acceptance by third-party platforms.
</Typography>



{/* ARTICLE 6 */}

<Typography
variant="h5"
gutterBottom
sx={{
mt:4,
mb:2,
fontFamily: theme.typography.fontFamily,
fontWeight:"bold",
color:theme.palette.text.primary
}}
>
6. Revenue and Payments
</Typography>


<Typography variant="body1" gutterBottom>

Revenue may originate from:

<br />
<br />

• Subscriptions
<br />
• Advertisements
<br />
• Licensing
<br />
• Artist support contributions
<br />
• Distribution services
<br />
• Future monetization opportunities

<br />
<br />

Payments:

<br />
<br />

• May be processed monthly
<br />
• May require payout minimums
<br />
• May include processing fees
<br />
• Require accurate payment information

<br />
<br />

Flolup reserves the right to delay or withhold payments in cases involving:

<br />
<br />

• Fraud
<br />
• Chargebacks
<br />
• Copyright disputes
<br />
• Legal obligations
</Typography>


{/* ARTICLE 7 */}

<Typography
variant="h5"
gutterBottom
sx={{
mt:4,
mb:2,
fontFamily: theme.typography.fontFamily,
fontWeight:"bold",
color:theme.palette.text.primary
}}
>
7. Artist Support and Booking Services
</Typography>

<Typography variant="body1" gutterBottom>

Flolup may allow artist support functionality where listeners can financially support artists.

Eligibility requirements may include:

<br />
<br />

• Platform activity
<br />
• Views
<br />
• Shares
<br />
• Engagement metrics
<br />
• Account standing

<br />
<br />

Flolup reserves the right to modify eligibility requirements.

<br />
<br />

Booking services only connect users and artists.

Flolup is not responsible for:

<br />
<br />

• Negotiations
<br />
• Agreements
<br />
• Payments between parties
<br />
• Disputes between users and artists
</Typography>



{/* ARTICLE 8 */}

<Typography
variant="h5"
gutterBottom
sx={{
mt:4,
mb:2,
fontFamily: theme.typography.fontFamily,
fontWeight:"bold",
color:theme.palette.text.primary
}}
>
8. Copyright and Content Removal
</Typography>

<Typography variant="body1" gutterBottom>

Flolup respects intellectual property rights and reserves the right to:

<br />
<br />

• Remove content
<br />
• Restrict access
<br />
• Suspend accounts
<br />
• Investigate complaints

<br />
<br />

Repeated copyright violations may result in permanent account termination.
</Typography>


{/* ARTICLE 9 */}

<Typography
variant="h5"
gutterBottom
sx={{
mt:4,
mb:2,
fontFamily: theme.typography.fontFamily,
fontWeight:"bold",
color:theme.palette.text.primary
}}
>
9. Limitation of Liability
</Typography>

<Typography variant="body1" gutterBottom>

To the maximum extent permitted by law, Flolup shall not be liable for:

<br />
<br />

• Lost profits
<br />
• Lost opportunities
<br />
• Data loss
<br />
• Service interruption
<br />
• Indirect damages
<br />
• Consequential damages

<br />
<br />

Flolup does not guarantee uninterrupted service or guaranteed earnings.
</Typography>



{/* ARTICLE 10 */}

<Typography
variant="h5"
gutterBottom
sx={{
mt:4,
mb:2,
fontFamily: theme.typography.fontFamily,
fontWeight:"bold",
color:theme.palette.text.primary
}}
>
10. Termination
</Typography>

<Typography variant="body1" gutterBottom>

Artists may terminate their account at any time.

Flolup may suspend or terminate accounts for:

<br />
<br />

• Fraud
<br />
• Copyright violations
<br />
• Abuse
<br />
• Violation of this Agreement
<br />
• Legal requirements

<br />
<br />

Termination does not remove obligations or liabilities that arose before account termination.
</Typography>



{/* ARTICLE 11 */}

<Typography
variant="h5"
gutterBottom
sx={{
mt:4,
mb:2,
fontFamily: theme.typography.fontFamily,
fontWeight:"bold",
color:theme.palette.text.primary
}}
>
11. Changes to Agreement
</Typography>

<Typography variant="body1" gutterBottom>

Flolup may update this Agreement periodically.

When significant changes occur:

<br />
<br />

• Artists may be notified
<br />
• Re-acceptance may be required
<br />
• Certain services may become unavailable until updated terms are accepted
</Typography>



{/* ARTICLE 12 */}

<Typography
variant="h5"
gutterBottom
sx={{
mt:4,
mb:2,
fontFamily: theme.typography.fontFamily,
fontWeight:"bold",
color:theme.palette.text.primary
}}
>
12. Governing Law
</Typography>

<Typography variant="body1" gutterBottom>

This Agreement shall be governed by the laws of the State of Arizona, United States.
</Typography>



{/* ARTICLE 13 */}

<Typography
variant="h5"
gutterBottom
sx={{
mt:4,
mb:2,
fontFamily: theme.typography.fontFamily,
fontWeight:"bold",
color:theme.palette.text.primary
}}
>
13. Electronic Signature and Acceptance
</Typography>

<Typography variant="body1" gutterBottom>

By checking:

<br />
<br />

☑ I have read and agree to the Flolup Artist Agreement

<br />
<br />

You acknowledge that:

<br />
<br />

• Your acceptance constitutes an electronic signature
<br />
• This Agreement is legally binding
<br />
• You understand your rights and responsibilities
</Typography>

</Container>





</>











  );
}



