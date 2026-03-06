import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import { Facebook, Twitter, Instagram, YouTube } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { usePWAInstall } from '../PWAInstall/pwaInstall';
import { getClientDeviceInfo } from '../utils/detectDevice/getClientDeviceInfo';

const DOWNLOAD_CONFIG_KEYS = [
  'FLOOLUP_APP_DOWNLOAD',
  'FLOOLUP_DOWNLOAD',
  'AFROFEEL_APP_DOWNLOAD',
  'AFROFEEL_DOWNLOAD',
  'APP_DOWNLOAD_CONFIG',
  'DOWNLOAD_CONFIG',
  'APP_DOWNLOAD',
  'DOWNLOAD_APP',
  '__APP_DOWNLOAD_CONFIG__',
  '__DOWNLOAD_CONFIG__',
];

const openExternalUrl = (url) => {
  if (!url || typeof window === 'undefined') {
    return false;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
};

const dispatchDownloadEvent = (eventName, detail = {}) => {
  if (typeof window === 'undefined' || !eventName) {
    return false;
  }
  try {
    const event = new CustomEvent(eventName, { detail, bubbles: true });
    window.dispatchEvent(event);
    return true;
  } catch (error) {
    console.error('Download event dispatch failed', error);
    return false;
  }
};

const normalizePlatformKey = (platformName = '', isMobile = false) => {
  const normalized = String(platformName || '').toLowerCase();

  if (/android/.test(normalized)) return 'android';
  if (/ios|iphone|ipad|ipod|ipados/.test(normalized)) return 'ios';
  if (/windows|win32|win64/.test(normalized)) return 'desktop';
  if (/mac|macintosh|macintel|macppc/.test(normalized)) return 'desktop';
  if (/linux/.test(normalized)) return 'desktop';
  if (/cros|chromeos/.test(normalized)) return 'desktop';
  if (normalized) return normalized;
  return isMobile ? 'mobile' : 'desktop';
};

const getDownloadConfig = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  for (const candidate of DOWNLOAD_CONFIG_KEYS) {
    const value = window[candidate];
    if (value) {
      return value;
    }
  }
  return null;
};

const triggerDownloadTarget = (target, platformKey) => {
  if (!target) {
    return false;
  }
  if (typeof target === 'string') {
    return openExternalUrl(target);
  }
  if (typeof target === 'function') {
    target(platformKey);
    return true;
  }

  if (typeof target === 'object' && target !== null && 'platforms' in target) {
    return false;
  }

  const { url, handler, action, modalHandler, eventName, event, modalId } = target;

  if (typeof url === 'string') {
    return openExternalUrl(url);
  }
  if (typeof handler === 'function') {
    handler(platformKey);
    return true;
  }
  if (typeof action === 'function') {
    action(platformKey);
    return true;
  }
  if (typeof modalHandler === 'function') {
    modalHandler({ platform: platformKey });
    return true;
  }
  if (typeof eventName === 'string') {
    return dispatchDownloadEvent(eventName, { platform: platformKey, target });
  }
  if (typeof event === 'string') {
    return dispatchDownloadEvent(event, { platform: platformKey, target });
  }
  if (typeof modalId === 'string') {
    return dispatchDownloadEvent('open-modal', { modalId, platform: platformKey });
  }
  return false;
};

const Footer = () => {
  const { isInstallable, triggerInstall } = usePWAInstall();
  
  const handleDownloadApp = () => {
    if (isInstallable) {
      triggerInstall();
      return;
    }

    const downloadConfig = getDownloadConfig();
    if (!downloadConfig) {
      return;
    }

    const client = getClientDeviceInfo();
    const platformKey = normalizePlatformKey(client.platform, client.isMobile);

    if (typeof downloadConfig !== 'object' || Array.isArray(downloadConfig)) {
      triggerDownloadTarget(downloadConfig, platformKey);
      return;
    }

    const platforms = downloadConfig.platforms || {};
    const targets = [
      platforms[platformKey],
      platforms[client.platform],
      platforms[client.device],
      platforms.mobile,
      platforms.desktop,
      platforms.default,
      downloadConfig.link,
      downloadConfig.url,
      downloadConfig.download,
      downloadConfig.modal,
      downloadConfig.handler,
      downloadConfig.action,
      downloadConfig.install,
      downloadConfig.open,
      downloadConfig.default,
      downloadConfig.defaultUrl,
      downloadConfig.defaultLink,
      downloadConfig.prompt,
      downloadConfig.dialog,
    ];

    for (const target of targets) {
      if (triggerDownloadTarget(target, platformKey)) {
        return;
      }
    }

    if (downloadConfig.defaultAction) {
      triggerDownloadTarget(downloadConfig.defaultAction, platformKey);
      return;
    }

    if (downloadConfig.modalAction) {
      triggerDownloadTarget(downloadConfig.modalAction, platformKey);
    }
  };

  const footerLinks = [
    {
      title: 'Get Started',
      links: [
        { label: 'Sign Up', to: '/user/signup' },
        { label: 'Download App', handler: handleDownloadApp },
        { label: 'Pricing', to: '/premium#pricing-plans' },
      
      ]
    },
    {
      title: 'Discover',
      links: [
        { label: 'Genres', to: '/explore#genres-section' },
       
        { label: 'New Releases', to: '/welcome#new-releases' },
        { label: 'Radio', to: '/welcome#radio-section' }
      ]
    },
    {
      title: 'Account',
      links: [
    { label: 'Settings', to: '/user/settings#user-settings-page' },
        { label: 'Subscription', to: '/premium' },
        { label: 'Help', to: '/support#contact-support' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About', to: '#' },
        { label: 'Careers', to: '#' },
        { label: 'Legal', to: '/terms#legal' }
      ]
    }
  ];

  const legalLinks = [
    { label: 'Privacy', to: '/terms#privacy' },
    { label: 'Terms and Conditions', to: '/terms' },
  
    { label: 'Contact', to: '/support#contact-support' }
  ];

  const socialIcons = [
    { icon: <Facebook />, color: '#4267B2', label: 'Facebook' },
    { icon: <Twitter />, color: '#1DA1F2', label: 'Twitter' },
    { icon: <Instagram />, color: '#E1306C', label: 'Instagram' },
    { icon: <YouTube />, color: '#FF0000', label: 'YouTube' }
  ];

  const getLinkProps = (link) => {
    const props = {};
    if (link.to) {
      props.component = RouterLink;
      props.to = link.to;
    } else {
      props.href = link.href || '#';
    }

    if (link.handler) {
      props.onClick = (event) => {
        if (!link.href) {
          event.preventDefault();
        }
        link.handler(event);
      };
    }

    if (link.target) {
      props.target = link.target;
    }
    if (link.rel) {
      props.rel = link.rel;
    }

    return props;
  };

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
          <Grid size={{ xs: 6, sm: 3}}  key={column.title}>
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
                <li key={link.label}>
                  <Link
                    {...getLinkProps(link)}
                    sx={{
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
                    }}
                  >
                    {link.label}
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
              {...getLinkProps(link)}
              key={link.label}
              sx={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.85rem',
                textDecoration: 'none',
                '&:hover': {
                  color: '#E4C421'
                }
              }}
            >
              {link.label}
            </Link>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
