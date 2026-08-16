import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

const promotedArtists = [
  { id: 1, name: 'Rema', context: 'Afrobeats rotation', date: 'Nov 15', initials: 'RE' },
  { id: 2, name: 'Ayra Starr', context: 'Pop discoveries', date: 'Dec 1', initials: 'AS' },
  { id: 3, name: 'Asake', context: 'Street-hop picks', date: 'Jan 8', initials: 'AK' },
];

const PromotedArtists = () => {
  const theme = useTheme();

  return (
    <Box
      component="aside"
      sx={{
        width: 320,
        flexShrink: 0,
        position: 'sticky',
        top: 104,
        alignSelf: 'flex-start',
        display: { xs: 'none', lg: 'block' },
      }}
    >
      <Box
        sx={{
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
          background: alpha(theme.palette.background.paper, 0.78),
          boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
          p: 2,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, color: theme.palette.text.primary }}>
              Coming Soon
            </Typography>
            <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.62) }}>
              Releases to watch
            </Typography>
          </Box>
          <Chip
            label="Featured"
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.14),
              color: theme.palette.primary.main,
              fontWeight: 800,
            }}
          />
        </Stack>

        <Stack spacing={1}>
          {promotedArtists.map((artist) => (
            <Box
              key={artist.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                p: 1,
                borderRadius: 1.5,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.055),
                },
              }}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  bgcolor: alpha(theme.palette.primary.main, 0.16),
                  color: theme.palette.primary.main,
                  fontWeight: 900,
                }}
              >
                {artist.initials}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontWeight: 800, color: theme.palette.text.primary }} noWrap>
                  {artist.name}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.62) }} noWrap>
                  {artist.context}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.48), flexShrink: 0 }}>
                {artist.date}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 1.5,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.18)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
          }}
        >
          <Typography sx={{ fontWeight: 900, color: theme.palette.text.primary, mb: 0.25 }}>
            Promote Your Music
          </Typography>
          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.66), display: 'block', mb: 1.25 }}>
            Reach listeners from the home rotation.
          </Typography>
          <Button
            size="small"
            variant="contained"
            fullWidth
            sx={{ borderRadius: 1.5, fontWeight: 800, textTransform: 'none' }}
          >
            Learn More
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default PromotedArtists;
