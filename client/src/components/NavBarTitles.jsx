import React from "react";
import { useLocation, Link } from "react-router-dom"; // Import useLocation and Link
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Breadcrumbs, { breadcrumbsClasses } from '@mui/material/Breadcrumbs';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  [`& .${breadcrumbsClasses.separator}`]: {
    color: (theme.vars || theme).palette.action.disabled,
    margin: 1,
  },
  [`& .${breadcrumbsClasses.ol}`]: {
    alignItems: 'center',
  },
}));

export default function NavbarTitles() {
  const location = useLocation(); // Hook to get current location (URL)

  // Split the pathname into segments, remove leading empty segments
  const pathnames = location.pathname.split('/').filter(x => x);

  // Map of valid breadcrumb titles
  const breadcrumbTitlesMap = {
    home: 'Home',
    content: 'Content',
    dashboard: 'Dashboard',
  };

  // Always start with 'Studio' breadcrumb
  const breadcrumbTitles = ['Studio'];

  // Add other breadcrumbs based on the current path
  pathnames.forEach(segment => {
    if (breadcrumbTitlesMap[segment]) {
      breadcrumbTitles.push(breadcrumbTitlesMap[segment]);
    }
  });

  // Base path for the "Studio" breadcrumb
  const basePath = '/artist/studio/home';

  return (
    <StyledBreadcrumbs
      aria-label="breadcrumb"
      separator={<NavigateNextRoundedIcon fontSize="small" sx={{color: ' var(--primary-font-color)'}}/>}
    >
      {/* Start with 'Studio' breadcrumb, link to /artist/studio */}
      <Link to={basePath} style={{ textDecoration: 'none' }}>
        <Typography variant="body1" sx={{ color: 'var(--primary-font-color)', fontSize: '1.3rem', fontWeight: 400 }}>
          Studio
        </Typography>
      </Link>

      {/* Dynamically display breadcrumbs based on the path */}
      {breadcrumbTitles.slice(1).map((value, index) => {
        // Build the dynamic link for each segment
        // Start with '/artist/studio' and append each part dynamically
        const to = `/${['artist', 'studio', ...pathnames.slice(0, index + 1)].join('/')}`;

        return (
          <Link to={to} key={to} style={{ textDecoration: 'none' }}>
            <Typography variant="body1" sx={{ color: ' var(--primary-font-color)', fontSize: '1rem', fontWeight: 600 }}>
              {value.charAt(0).toUpperCase() + value.slice(1)} {/* Capitalize first letter */}
            </Typography>
          </Link>
        );
      })}
    </StyledBreadcrumbs>
  );
}
