import { useState, useCallback, lazy, Suspense } from 'react';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import MailOutlineIcon from '@mui/icons-material/MailOutline';

const LazyArtistMessagingPanel = lazy(() => import('./ArtistMessagingPanel.jsx'));

const PlaceholderButton = ({ onClick }) => (
  <IconButton
    aria-label="Open chat menu"
    onClick={onClick}
    sx={{ color: 'white' }}
  >
    <Badge badgeContent={0} color="secondary" showZero>
      <MailOutlineIcon fontSize="large" />
    </Badge>
  </IconButton>
);

export default function ArtistMessagingLoader() {
  const [panelVisible, setPanelVisible] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);

  const handleTrigger = useCallback(() => {
    setPanelVisible(true);
    setAutoOpen(true);
  }, []);

  const handleAutoOpenHandled = useCallback(() => {
    setAutoOpen(false);
  }, []);

  const placeholder = <PlaceholderButton onClick={handleTrigger} />;

  if (!panelVisible) {
    return placeholder;
  }

  return (
    <Suspense fallback={placeholder}>
      <LazyArtistMessagingPanel
        initialOpen={autoOpen}
        onInitialOpenHandled={handleAutoOpenHandled}
      />
    </Suspense>
  );
}
