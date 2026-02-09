import { useState } from 'react';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import { useTheme } from "@mui/material/styles";
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import  TextField from '@mui/material/TextField';
import AccordionDetails from '@mui/material/AccordionDetails';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';
import Typography from "@mui/material/Typography";
import Box from '@mui/material/Box';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmailIcon from '@mui/icons-material/Email';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';
import { useMutation } from '@apollo/client';
import { SEND_SUPPORT_MESSAGE } from '../utils/mutations';




export const Support = () => {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    category: 'general',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [sendSupportMessage, { loading: submitting }] = useMutation(SEND_SUPPORT_MESSAGE);


  const faqs = [
    {
      question: "How do I download songs for offline listening?",
      answer: "Tap the download icon (↓) on any track. Premium users enjoy unlimited downloads.",
      tags: ['download', 'offline']
    },
    {
      question: "Why do I hear ads? How do I remove them?",
      answer: "Ads support our free tier. Upgrade to Premium in Settings → Subscription for an ad-free experience.",
      tags: ['ads', 'premium']
    },
    {
      question: "Can I share songs with friends?",
      answer: "Yes! Tap the share icon on any track to share via social media, messaging apps, or copy a direct link.",
      tags: ['share', 'social']
    },
    {
      question: "How do I create and manage playlists?",
      answer: "1. Go to any song → Tap 'Add to playlist' → 'Create new playlist'.\n2. Find your playlists in Library → Playlists.\n3. Premium users can create unlimited playlists.",
      tags: ['playlists', 'library']
    },
    {
      question: "Why is a song not playing or showing as unavailable?",
      answer: "This could be due to:\n• Regional restrictions\n• Copyright limitations\n• Artist removed the track\nTry using a VPN or contact support if persistent.",
      tags: ['playback', 'error']
    },
    {
      question: "How do I cancel my Premium subscription?",
      answer: "Settings → Subscription → Manage Subscription → Cancel. You'll keep Premium until the end of your billing period.",
      tags: ['billing', 'subscription']
    },
    {
      question: "Is my payment information secure?",
      answer: "Yes! We use Stripe for secure payments. We never store your credit card details on our servers.",
      tags: ['security', 'payments']
    },
    {
      question: "How do I reset my password?",
      answer: "Go to Settings → Account → Change Password. Or tap 'Forgot Password' on the login screen.",
      tags: ['account', 'password']
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    // Simple submission - replace with API call
    console.log('Support request:', contactForm);
    
    const payload = { ...contactForm, category: contactForm.category || 'general' };
    try {
      const { data } = await sendSupportMessage({
        variables: { input: payload },
      });
      if (!data?.sendSupportMessage?.success) {
        throw new Error(data?.sendSupportMessage?.message || 'Support request failed.');
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setContactForm({ name: '', email: '', category: 'general', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Support form error', error);
      setErrorMessage(error.message || 'Support request failed. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        px: { xs: 2, md: 4 },
        py: 4,
        mx: 'auto',
        width: '100%',
        maxWidth: 1200,
        fontFamily: theme.typography.fontFamily,
      }}
    >

        
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <LiveHelpIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" gutterBottom fontWeight="bold">
          How can we help?
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Find answers or contact our support team
        </Typography>
      </Box>

      {/* Search Bar */}
      {/* <Paper sx={{ p: 2, mb: 4, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Search for help..."
          variant="outlined"
          size="small"
        />
        <Button variant="contained">Search</Button>
      </Paper> */}

      <Divider sx={{ my: 4 }} />


      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          {
            icon: <HelpOutlineIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />,
            title: '24/7 FAQ',
            body: 'Instant answers anytime',
          },
          {
            icon: <EmailIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />,
            title: '24h Response',
            body: 'Email support within a day',
          },
          {
            icon: <SmartphoneIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />,
            title: 'App Help',
            body: 'In-app support available',
          },
        ].map((stat) => (
          <Grid key={stat.title} size={{ xs: 12, sm: 4 }}  sx={{margin: '0 auto'}}>
            <Card sx={{ p: 3, textAlign: 'center', height: '100%', width: "100%" }}>
              {stat.icon}
              <Typography variant="h5">{stat.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.body}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>



      <Divider sx={{ my: 4 }} />



      {/* FAQ Section */}
      <Typography
        variant="h4"
        gutterBottom
        sx={{ mb: 3, color: theme.palette.text.primary }}
      >
        Frequently Asked Questions
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {faqs.map((faq, index) => (
          <Grid key={faq.question} size={{ xs: 12 }}>
            <Paper elevation={1} sx={{ p: 1, borderRadius: 2 }}>
              <Accordion
                expanded={expanded === index}
                onChange={() => setExpanded(expanded === index ? false : index)}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 64 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={600}>{faq.question}</Typography>
                    <Box sx={{ mt: 0.75 }}>
                      {faq.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, mt: 0.5 }} />
                      ))}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography whiteSpace="pre-line">{faq.answer}</Typography>
                </AccordionDetails>
              </Accordion>
            </Paper>
          </Grid>
        ))}
      </Grid>




    <Typography variant="h4" gutterBottom>
          Contact Support
        </Typography>

      {/* Contact Form */}
      <Paper
        sx={{
          p: 4,
          mt: 6,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
    

        {submitted ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" color="success.main" gutterBottom>
              ✓ Message Sent!
            </Typography>
            <Typography>
              We'll respond within 24 hours. Check your email.
            </Typography>
          </Box>
        ) : (
          <>
            {errorMessage && (
              <Typography color="error.main" sx={{ mb: 2 }}>
                {errorMessage}
              </Typography>
            )}


            <Box sx={{ width: '100%', maxWidth: 960 }}>
              <form onSubmit={handleSubmit} sx={{width: '100%'}}>
                <Grid container spacing={3}>
                <Grid  size={{ xs: 12 }}>

                  <TextField
                    fullWidth
                    label="Your Name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                   
                  />


                </Grid>

                <Grid  size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                  />
                </Grid>
                
                  <Grid  size={{ xs: 12 }}>
                  <TextField
                    select
                    fullWidth
                    label="Issue Type"
                    value={contactForm.category}
                    onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                  >
                    <MenuItem value="general">General Inquiry</MenuItem>
                    <MenuItem value="bug">Bug Report</MenuItem>
                    <MenuItem value="billing">Billing & Subscription</MenuItem>
                    <MenuItem value="feature">Feature Request</MenuItem>
                    <MenuItem value="account">Account Issues</MenuItem>
                    <MenuItem value="copyright">Copyright Issue</MenuItem>
                  </TextField>
                </Grid>
                 <Grid  size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={5}
                    label="Describe your issue in detail"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                  />
                </Grid>
                <Grid xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={!contactForm.name || !contactForm.email || !contactForm.message || submitting}
                  >
                    {submitting ? 'Sending…' : 'Send Message'}
                  </Button>
                </Grid>
              </Grid>
              </form>
            </Box>
          </>
        )}
      </Paper>


      {/* Additional Help */}
      {/* <Box sx={{ mt: 6, p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Other Ways to Get Help
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Community Forum
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connect with other users, share tips, and get community support.
            </Typography>
            <Button sx={{ mt: 1 }}>Visit Forum</Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Status Page
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check if we're experiencing any service outages or maintenance.
            </Typography>
            <Button sx={{ mt: 1 }}>Check Status</Button>
          </Grid>
        </Grid>
      </Box> */}


      {/* Footer Links */}
      <Divider sx={{ my: 4 }} />

      {/* <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
        <Link href="/terms" underline="hover">Terms of Service</Link>
        <Link href="/privacy" underline="hover">Privacy Policy</Link>
        <Link href="/refund" underline="hover">Refund Policy</Link>
        <Link href="/community" underline="hover">Community Guidelines</Link>
        <Link href="/contact" underline="hover">Contact</Link>
      </Box> */}


    </Box>
  );
};
