import { alpha, styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SitemarkIcon } from './themeCustomization/customIcon';
import MenuContent from './MenuContent';


// const drawerWidth = 240;

// const Drawer = styled(MuiDrawer)({
//   width: drawerWidth,
//   flexShrink: 0,
//   boxSizing: 'border-box',
//   mt: 10,
//   [`& .${drawerClasses.paper}`]: {
//     width: drawerWidth,
//     boxSizing: 'border-box',
//   },
// });

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "openDrawer", 
})(({ openDrawer, theme }) => ({
  width: openDrawer ? 240 : 0,
  flexShrink: 0,
  boxSizing: "border-box",
  mt: 10,
  transition: "width 0.3s ease-in-out", 
  [`& .${drawerClasses.paper}`]: {
    width: openDrawer ? 240 : 0,
    boxSizing: "border-box",
    overflow: openDrawer ? "hidden" : "hidden",
    background: `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.96)} 100%)`,
    borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
    boxShadow: `18px 0 40px ${alpha(theme.palette.common.black, 0.24)}`,
    color: theme.palette.text.primary,
  },
}));


export default function SideMenu({openDrawer, profileImage, artistProfile }){



    return (

          <Drawer
      variant="permanent"
      openDrawer={openDrawer}
       
      sx={{
        display: { xs: 'none', md: 'block', },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mt: 'calc(var(--template-frame-height, 0px) + 4px)',
          px: 2,
          py: 2.25,
        }}
      >
        <Box
          sx={(theme) => ({
            width: '100%',
            minHeight: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
            background: alpha(theme.palette.common.white, 0.04),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          })}
        >
          <SitemarkIcon />
        </Box>
      </Box>

      <Divider sx={{ borderColor: (theme) => alpha(theme.palette.text.primary, 0.08), mx: 2 }}/>
      <Box
        sx={{
          overflow: 'hidden auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          px: 1,
        }}
      >

       <MenuContent />
        {/* <CardAlert />  */}
      </Box>


      <Stack
        direction="column"
        sx={{
          m: 1.5,
          p: 1.5,
          gap: 0.9,
          width: 'calc(100% - 24px)',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          borderRadius: 2,
          border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
          backgroundColor: (theme) => alpha(theme.palette.common.white, 0.04),
        }}
      >
        <Avatar
          sizes="small"
          alt={artistProfile?.fullName || 'Artist'}
          src= {profileImage}
          sx={(theme) => ({
            width: 38,
            height: 38,
            mx: 'auto',
            bgcolor: alpha(theme.palette.primary.main, 0.18),
            color: theme.palette.primary.main,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.26)}`,
          })}
        />
        <Box
          sx={{
            minWidth: 0,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="body2"
            noWrap
            sx={{
              width: '100%',
              maxWidth: 180,
              fontWeight: 800,
              lineHeight: '18px',
              textAlign: 'center',
            }}
          >
            {artistProfile?.fullName || 'Artist studio'}
          </Typography>
          <Typography
            variant="caption"
            noWrap
            sx={{
              width: '100%',
              maxWidth: 180,
              color: 'text.secondary',
              display: 'block',
              mt: 0.25,
              textAlign: 'center',
            }}
          >
            {artistProfile?.email || 'Studio account'}
          </Typography>
        </Box>
        {/* <OptionsMenu /> */}
      </Stack>
    </Drawer>



    )
}
