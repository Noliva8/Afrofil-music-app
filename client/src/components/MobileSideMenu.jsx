import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MenuButton from './MenuButton';
import { SitemarkIcon } from './themeCustomization/customIcon';
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import MenuContent from './MenuContent';

const drawerWidth = 440;

const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  mt: 10,
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
  },
});




export default function MobileSideMenu({openMobileMenu, handleShowMobileMenu, profileImage, artistProfile}){
    return (

          <Drawer

    
       anchor='right' 
       variant="temporary"
        open={openMobileMenu}
        onClose={handleShowMobileMenu}
      sx={{
        display: { xs: openMobileMenu? "block": "none", md: 'none', },
        [`& .${drawerClasses.paper}`]: {
          backgroundColor: 'var(--primary-background-color)',
        }, 
        zIndex: '8888'
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

      <Divider sx={{bgcolor: 'var(--secondary-background-color)' }}/>
      <Box
        sx={{
          overflow: 'auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >

       <MenuContent handleShowMobileMenu={handleShowMobileMenu}/>
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
          src={profileImage}
          sx={{ width: 36, height: 36 }}
        />
        <Box sx={{ mr: 'auto' }}>
          <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: '16px' }}>
            { artistProfile.fullName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'var( --primary-font-color)' }}>
             { artistProfile.email}
          </Typography>
        </Box>
        {/* <OptionsMenu /> */}
      </Stack>
    </Drawer>



    )
}