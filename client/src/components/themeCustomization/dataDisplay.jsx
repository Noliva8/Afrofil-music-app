import { alpha} from '@mui/material/styles';
import { svgIconClasses } from '@mui/material/SvgIcon';
import { typographyClasses } from '@mui/material/Typography';
import { buttonBaseClasses } from '@mui/material/ButtonBase';
import { chipClasses } from '@mui/material/Chip';
import { iconButtonClasses } from '@mui/material/IconButton';
import { gray, red, green } from './themePrimitive';

export const dataDisplayCustomizations = {
  MuiList: {
    styleOverrides: {
      root: {
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      },
    },
  },
  MuiListItem: {
    styleOverrides: {
      root: (theme) => ({
        [`& .${svgIconClasses.root}`]: {
          width: '1rem',
          height: '1rem',
          
        },
        [`& .${typographyClasses.root}`]: {
          fontWeight: 500, fontSize: '1.2rem'
        },
        [`& .${buttonBaseClasses.root}`]: {
          display: 'flex',
          gap: 8,
          
          padding: '2px 8px',
          
          opacity: 0.7,
          '&.Mui-selected': {
            opacity: 1,
           
            [`& .${svgIconClasses.root}`]: {
              
             
            },
            '&:focus-visible': {
              
            },
            '&:hover': {
            
            },
          },
          '&:focus-visible': {
            backgroundColor: 'transparent',
          },
        },
      }),
    },
  },
  MuiListItemText: {
    styleOverrides: {
      primary: (theme) => ({
       
        fontWeight: 500,
       
      }),
      secondary: (theme) => ({
      
       
      }),
    },
  },
  MuiListSubheader: {
    styleOverrides: {
      root: (theme) => ({
        backgroundColor: 'transparent',
        padding: '4px 8px',
 
        fontWeight: 500,
        
      }),
    },
  },
  MuiListItemIcon: {
    styleOverrides: {
      root: {
        minWidth: 0,
        
      },
    },
  },
  MuiChip: {
    defaultProps: {
      size: 'small',
    },
    styleOverrides: {
      root: (theme) => ({
        border: '1px solid',
        borderRadius: '999px',
        [`& .${chipClasses.label}`]: {
          fontWeight: 600,
        },
        variants: [
          {
            props: {
              color: 'default',
            },
            style: {
              borderColor: gray[200],
              backgroundColor: gray[100],
              [`& .${chipClasses.label}`]: {
                color: gray[500],
              },
              [`& .${chipClasses.icon}`]: {
                color: gray[500],
              },
              ...(theme.applyStyles &&
                theme.applyStyles('dark', {
                  borderColor: gray[700],
                  backgroundColor: gray[800],
                  [`& .${chipClasses.label}`]: {
                    color: gray[300],
                  },
                  [`& .${chipClasses.icon}`]: {
                    color: gray[300],
                  },
                })),
            },
          },
          {
            props: {
              color: 'success',
            },
            style: {
              borderColor: green[200],
              backgroundColor: green[50],
              [`& .${chipClasses.label}`]: {
                color: green[500],
              },
              [`& .${chipClasses.icon}`]: {
                color: green[500],
              },
              ...(theme.applyStyles &&
                theme.applyStyles('dark', {
                  borderColor: green[800],
                  backgroundColor: green[900],
                  [`& .${chipClasses.label}`]: {
                    color: green[300],
                  },
                  [`& .${chipClasses.icon}`]: {
                    color: green[300],
                  },
                })),
            },
          },
          {
            props: {
              color: 'error',
            },
            style: {
              borderColor: red[100],
              backgroundColor: red[50],
              [`& .${chipClasses.label}`]: {
                color: red[500],
              },
              [`& .${chipClasses.icon}`]: {
                color: red[500],
              },
              ...(theme.applyStyles &&
                theme.applyStyles('dark', {
                  borderColor: red[800],
                  backgroundColor: red[900],
                  [`& .${chipClasses.label}`]: {
                    color: red[200],
                  },
                  [`& .${chipClasses.icon}`]: {
                    color: red[300],
                  },
                })),
            },
          },
          {
            props: { size: 'small' },
            style: {
              maxHeight: 20,
              [`& .${chipClasses.label}`]: {
                
              },
              [`& .${svgIconClasses.root}`]: {
               
              },
            },
          },
        ],
      }),
    },
  },
  MuiTablePagination: {
    styleOverrides: {
      actions: {
        display: 'flex',
        gap: 8,
        marginRight: 6,
        [`& .${iconButtonClasses.root}`]: {
          minWidth: 0,
          width: 36,
          height: 36,
        },
      },
    },
  },
  MuiIcon: {
    defaultProps: {
      fontSize: 'small',
    },
    styleOverrides: {
      root: {
        variants: [
          {
            props: {
              fontSize: 'small',
            },
            style: {
              fontSize: '1rem',
            },
          },
        ],
      },
    },
  },
};
