import { createTheme } from '@mui/material/styles';

const shadows = Array(25).fill('none');
shadows[1] = '0 10px 30px rgba(0, 0, 0, 0.45)';  
shadows[2] = '0 20px 55px rgba(0, 0, 0, 0.65), 0 8px 24px rgba(0, 0, 0, 0.35)';  
shadows[3] = '0 28px 70px rgba(0, 0, 0, 0.7)'; 

export const afrofeelTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      light: '#F3DD5A',
      main: '#E4C421',
      dark: '#A58B00',
      contrastText: '#000000',
    },
    secondary: {
      light: '#CC6E52',
      main: '#B25035',
      dark: '#7A2F1C',
      contrastText: '#ffffff',
    },
    google: {
      light: '#6EA0F8',
      main: '#4285F4',
      dark: '#3367D6',
      contrastText: '#ffffff',
    },
    background: {
      default: '#050509',
      paper: '#151520',
    },
    text: {
      primary: '#ffffff',
      secondary: '#B3B3C2',
    },
    action: {
      hoverOpacity: 0.08,
      selectedOpacity: 0.12,
      disabledOpacity: 0.4,
      focusOpacity: 0.15,
      activatedOpacity: 0.18,
    },
  },

  typography: {
    fontFamily: `'Sora', 'Manrope', 'Inter', system-ui, sans-serif`,
    h1: { fontFamily: `'Clash Display', 'Space Grotesk', 'Sora', sans-serif` },
    h2: { fontFamily: `'Clash Display', 'Space Grotesk', 'Sora', sans-serif` },
    h3: { fontFamily: `'Clash Display', 'Space Grotesk', 'Sora', sans-serif` },
    h4: { fontFamily: `'Clash Display', 'Space Grotesk', 'Sora', sans-serif` },
    h5: { fontFamily: `'Clash Display', 'Space Grotesk', 'Sora', sans-serif` },
    h6: { fontFamily: `'Clash Display', 'Space Grotesk', 'Sora', sans-serif` },
  },

  breakpoints: {
    values: {
      xs: 0,    // phones
      sm: 480,  // small phones / narrow
      md: 768,  // tablets
      lg: 1200, // desktops
      xl: 1600, // big screens / studio
    },
  },

  // Base spacing unit (theme.spacing(1) = 8px)
  spacing: 8,

  // Global motion tuning
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
    },
  },

  // Layering: player, overlay ads, modals, etc.
  zIndex: {
    mobileStepper: 1000,
    fab: 1050,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    player: 1201,     // custom: bottom player
    overlayAd: 1202,  // custom: optional overlay ads
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },

  shadows,

  components: {
    /* 🟡 BUTTONS – primary actions (Play, CTA, etc.) */
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 999,
          fontWeight: 600,
          paddingInline: '1.5rem',
          paddingBlock: '0.6rem',
          letterSpacing: 0.2,
          transition: 'all 0.2s ease',
          // Keyboard focus ring
          '&.Mui-focusVisible': {
            outline: '2px solid rgba(228,196,33,0.95)',
            outlineOffset: 3,
          },
          // Disabled state
          '&.Mui-disabled': {
            opacity: 0.4,
            cursor: 'not-allowed',
          },
        },
        containedPrimary: {
          backgroundColor: '#E4C421',
          color: '#000',
          '&:hover': {
            backgroundColor: '#D0B01E',
          },
          '&:active': {
            transform: 'scale(0.97)',
          },
          '&.Mui-disabled': {
            backgroundColor: 'rgba(228,196,33,0.5)',
            color: 'rgba(0,0,0,0.6)',
          },
        },
        containedSecondary: {
          backgroundColor: '#B25035',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#923F2A',
          },
          '&:active': {
            transform: 'scale(0.97)',
          },
          '&.Mui-disabled': {
            backgroundColor: 'rgba(178,80,53,0.5)',
            color: 'rgba(255,255,255,0.6)',
          },
        },
        text: {
          paddingInline: '0.5rem',
        },
      },
    },

    /* 🎛 ICON BUTTONS – play/pause/skip/like/etc. */
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          padding: 8,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
          '&.Mui-focusVisible': {
            outline: '2px solid rgba(228,196,33,0.95)',
            outlineOffset: 3,
          },
          '&.Mui-disabled': {
            opacity: 0.4,
          },
        },
      },
    },

    /* 🎵 CARDS – albums, playlists, artists */
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          background:
            'linear-gradient(145deg, rgba(20,20,30,0.95), rgba(10,10,18,0.98))',
          border: '1px solid rgba(255,255,255,0.03)',
          boxShadow: shadows[2],
          overflow: 'hidden',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: shadows[3],
            borderColor: 'rgba(228,196,33,0.35)',
          },
        },
      },
    },

    /* 🧊 PAPER – modals, menus, drawers, etc. */
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 18,
        },
        root: {
          backgroundColor: '#111119',
          backgroundImage: 'none',
        },
      },
    },

    /* 🧭 APP BAR – top nav */
    MuiAppBar: {
      styleOverrides: {
        root: {
          background:
            'linear-gradient(180deg, rgba(5,5,10,0.95), rgba(5,5,10,0.85))',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.65)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        },
      },
    },

    /* 📂 DRAWER – sidebar navigation / mobile menu */
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#080810',
          borderRight: '1px solid rgba(255,255,255,0.04)',
        },
      },
    },

    /* 🎚 SLIDER – progress + volume */
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 4,
          borderRadius: 999,
        },
        rail: {
          opacity: 0.35,
          backgroundColor: '#444457',
        },
        track: {
          border: 'none',
          borderRadius: 999,
          backgroundColor: '#E4C421',
        },
        thumb: {
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: '#fff',
          boxShadow: '0 0 0 4px rgba(228,196,33,0.25)',
          '&:hover, &.Mui-focusVisible': {
            boxShadow: '0 0 0 6px rgba(228,196,33,0.35)',
          },
        },
      },
    },

    /* 👤 AVATAR – artist / user / playlist avatar */
    MuiAvatar: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#222233',
        },
      },
    },

    /* 🔤 TYPOGRAPHY – subtle global tweaks */
    MuiTypography: {
      styleOverrides: {
        root: {
          letterSpacing: 0.1,
        },
      },
    },

    /* 🧭 TABS – “Songs / Albums / Artists / For You” etc. */
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 40,
        },
        indicator: {
          height: 3,
          borderRadius: 999,
          backgroundColor: '#E4C421',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minHeight: 40,
          paddingInline: 12,
          fontWeight: 500,
          fontSize: '0.9rem',
          '&.Mui-selected': {
            color: '#E4C421',
          },
        },
      },
    },

    /* ⋯ MENUS – song context menus, profile menu, etc. */
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          backgroundColor: '#14141F',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.9rem',
          '&.Mui-selected': {
            backgroundColor: 'rgba(228,196,33,0.12)',
          },
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.06)',
          },
        },
      },
    },

    /* 🔔 BADGE – notification dots, counters */
    MuiBadge: {
      styleOverrides: {
        badge: {
          borderRadius: 999,
          fontSize: '0.65rem',
          fontWeight: 600,
          paddingInline: 4,
          backgroundColor: '#B25035',
        },
      },
    },

    /* 💬 TOOLTIP – icon explanations */
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          backgroundColor: '#1B1B27',
          fontSize: '0.75rem',
          padding: '6px 10px',
        },
      },
    },

    /* ✅ SNACKBAR – “Added to playlist”, “Login required”, etc. */
    MuiSnackbar: {
      styleOverrides: {
        root: {
          zIndex: 1400,
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          backgroundColor: '#15151F',
          color: '#ffffff',
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },

    /* OPTIONAL – Lists & dividers for queues / side nav */
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&.Mui-selected': {
            backgroundColor: 'rgba(228,196,33,0.12)',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255,255,255,0.06)',
        },
      },
    },
  },
});
