import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

function DashboardPageNavigation() {
  const location = useLocation();

  // This is just a sample of how you can render different content based on the path.
  const renderContent = () => {
    switch (location.pathname) {
      case '/dashboard':
        return <Typography>Dashboard content</Typography>;
      case '/content':
        return <Typography>Content page</Typography>;
      case '/reports/sales':
        return <Typography>Sales reports</Typography>;
      case '/reports/traffic':
        return <Typography>Traffic reports</Typography>;
      case '/integrations':
        return <Typography>Integrations page</Typography>;
      default:
        return <Typography>Default content for undefined routes</Typography>;
    }
  };

  return (
    <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      {renderContent()}
    </Box>
  );
}

export default DashboardPageNavigation;
