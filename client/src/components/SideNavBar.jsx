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
    overflow: openDrawer ? "visible" : "hidden",
    background: alpha(theme.palette.background.paper, 0.94),
    borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
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
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          mt: 'calc(var(--template-frame-height, 0px) + 4px)',
          p: 1.5,
        }}
      >

       

       <SitemarkIcon />

      </Box>

      <Divider sx={{ borderColor: (theme) => alpha(theme.palette.primary.main, 0.18) }}/>
      <Box
        sx={{
          overflow: 'auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >

       <MenuContent />
        {/* <CardAlert />  */}
      </Box>


      <Stack
        direction="row"
        sx={{
          p: 2,
          gap: 1,
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Avatar
          sizes="small"
          alt="Riley Carter"
          src= {profileImage}
          sx={{ width: 36, height: 36 }}
        />
        <Box sx={{ mr: 'auto' }}>
          <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: '16px' }}>
            {artistProfile.fullName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {artistProfile.email}
          </Typography>
        </Box>
        {/* <OptionsMenu /> */}
      </Stack>
    </Drawer>



    )
}
