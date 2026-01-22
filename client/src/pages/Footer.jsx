import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import { Facebook, Twitter, Instagram, YouTube } from '@mui/icons-material';

const Footer = () => {
  const footerLinks = [
    {
      title: 'Get Started',
      links: ['Sign Up', 'Download App', 'Pricing', 'Features']
    },
    {
      title: 'Discover',
      links: ['Genres', 'Charts', 'New Releases', 'Radio']
    },
    {
      title: 'Account',
      links: ['Profile', 'Settings', 'Subscription', 'Help']
    },
    {
      title: 'Company',
      links: ['About', 'Careers', 'Press', 'Legal']
    }
  ];

  const legalLinks = [
    'Privacy',
    'Terms and Conditions',
    'Accessibility Statement',
    'Contact'
  ];

  const socialIcons = [
    { icon: <Facebook />, color: '#4267B2', label: 'Facebook' },
    { icon: <Twitter />, color: '#1DA1F2', label: 'Twitter' },
    { icon: <Instagram />, color: '#E1306C', label: 'Instagram' },
    { icon: <YouTube />, color: '#FF0000', label: 'YouTube' }
  ];

  return (
    <Box sx={{
      backgroundColor: 'rgba(15, 15, 15, 0.95)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      px: { xs: 2, sm: 3, md: 4 },
      py: { xs: 4, md: 6 }
    }}>
      {/* Grid of links */}
      <Grid container spacing={4} sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {footerLinks.map((column) => (
          <Grid item xs={6} sm={3} key={column.title}>
            <Typography variant="h6" sx={{
              mb: 2,
              color: '#E4C421',
              fontWeight: 600,
              letterSpacing: '0.5px',
              fontSize: '1rem'
            }}>
              {column.title}
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {column.links.map((link) => (
                <li key={link}>
                  <Link href="#" sx={{
                    display: 'inline-block',
                    color: 'rgba(255,255,255,0.75)',
                    mb: 1,
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: '#E4C421',
                      transform: 'translateX(4px)'
                    }
                  }}>
                    {link}
                  </Link>
                </li>
              ))}
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Divider */}
      <Divider sx={{
        my: 4,
        borderColor: 'rgba(255,255,255,0.1)',
        maxWidth: '1200px',
        mx: 'auto'
      }} />

      {/* Bottom */}
      <Box sx={{
        maxWidth: '1200px',
        mx: 'auto',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        gap: { xs: 3, md: 0 },
        textAlign: { xs: 'center', md: 'left' }
      }}>
        {/* Tagline */}
        <Typography variant="h5" sx={{
          fontWeight: 700,
          background: 'linear-gradient(90deg, #E4C421, #B25035)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: { xs: '1.4rem', md: '1.75rem' },
        }}>
          Feel the music.
        </Typography>

        {/* Social Icons */}
        <Box sx={{
          display: 'flex',
          gap: 1,
          justifyContent: { xs: 'center', md: 'flex-start' }
        }}>
          {socialIcons.map((social, index) => (
            <IconButton
              key={index}
              aria-label={social.label}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  backgroundColor: social.color,
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {social.icon}
            </IconButton>
          ))}
        </Box>

        {/* Legal Links */}
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: { xs: 'center', md: 'flex-end' },
          gap: { xs: 1.5, md: 2 },
          mt: { xs: 2, md: 0 }
        }}>
          {legalLinks.map((link) => (
            <Link
              key={link}
              href="#"
              sx={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.85rem',
                textDecoration: 'none',
                '&:hover': {
                  color: '#E4C421'
                }
              }}
            >
              {link}
            </Link>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
