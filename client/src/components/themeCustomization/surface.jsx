import { alpha } from '@mui/material/styles';
import { gray } from './themePrimitive';

/* eslint-disable import/prefer-default-export */
export const surfacesCustomizations = {
  MuiAccordion: {
    defaultProps: {
      elevation: 0,
      disableGutters: true,
    },
    styleOverrides: {
      root: (theme) => ({
        padding: 4,
        overflow: 'clip',
        backgroundColor: (theme.vars || theme).palette.background.default,
        border: '1px solid',
        borderColor: (theme.vars || theme).palette.divider,
        ':before': {
          backgroundColor: 'transparent',
        },
        '&:not(:last-of-type)': {
          borderBottom: 'none',
        },
        '&:first-of-type': {
          borderTopLeftRadius: (theme.vars || theme).shape.borderRadius,
          borderTopRightRadius: (theme.vars || theme).shape.borderRadius,
        },
        '&:last-of-type': {
          borderBottomLeftRadius: (theme.vars || theme).shape.borderRadius,
          borderBottomRightRadius: (theme.vars || theme).shape.borderRadius,
        },
      }),
    },
  },
  MuiAccordionSummary: {
    styleOverrides: {
      root: (theme) => ({
        border: 'none',
        borderRadius: 8,
        '&:hover': { backgroundColor: gray[50] },
        '&:focus-visible': { backgroundColor: 'transparent' },
        ...(theme.applyStyles
          ? theme.applyStyles('dark', {
              '&:hover': { backgroundColor: gray[800] },
            })
          : {}),
      }),
    },
  },
  MuiAccordionDetails: {
    styleOverrides: {
      root: {
        marginBottom: 20,
        border: 'none',
      },
    },
  },
  MuiPaper: {
    defaultProps: {
      elevation: 0,
    },
  },
  MuiCard: {
    styleOverrides: {
      root: (theme) => ({
        padding: 16,
        gap: 16,
        transition: 'all 100ms ease',
        backgroundColor: gray[50],
       
      
        boxShadow: 'none',
        ...(theme.applyStyles
          ? theme.applyStyles('dark', {
              backgroundColor: gray[800],
            })
          : {}),
        variants: [
          {
            props: { variant: 'outlined' },
            style: {
             
              boxShadow: 'none',
              background: 'hsl(0, 0%, 100%)',
              ...(theme.applyStyles
                ? theme.applyStyles('dark', {
                    background: alpha(gray[900], 0.4),
                  })
                : {}),
            },
          },
        ],
      }),
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: 0,
        '&:last-child': { paddingBottom: 0 },
      },
    },
  },
  MuiCardHeader: {
    styleOverrides: {
      root: {
        padding: 0,
      },
    },
  },
  MuiCardActions: {
    styleOverrides: {
      root: {
        padding: 0,
      },
    },
  },
};
