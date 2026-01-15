import { Box, Button, Typography, useTheme } from '@mui/material';

const SectionRow = ({ title, items, onViewAll }) => {
  const theme = useTheme();
  return (
    <Box sx={{ mt: { xs: 4, md: 5 } }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.pxToRem(20),
            letterSpacing: 0.2,
          }}
        >
          {title}
        </Typography>
        <Button
          size="small"
          onClick={onViewAll}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            color: 'text.secondary',
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          View All
        </Button>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          overflowX: 'auto',
          pb: 1,
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {items.map((item) => (
          <Box
            key={item}
            sx={{
              flex: '0 0 auto',
              px: 2,
              py: 1.2,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: 'action.hover',
              minWidth: 140,
            }}
          >
            <Typography
              variant="body1"
              sx={{ fontWeight: 600, color: 'text.primary' }}
            >
              {item}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default function Explore() {
  const theme = useTheme();
  const countries = [
    'Nigeria',
    'Ghana',
    'Kenya',
    'South Africa',
    'Tanzania',
    'Uganda',
    'Rwanda',
    'Ethiopia',
    'Senegal',
    'Other',
  ];
  const genres = [
    'Afrobeats',
    'Amapiano',
    'Highlife',
    'Bongo Flava',
    'Afro Pop',
    'Hip Hop',
    'R and B',
    'Gospel',
  ];
  const moods = [
    'Chill',
    'Party',
    'Focus',
    'Romance',
    'Workout',
    'Late Night',
    'Morning',
    'Feel Good',
  ];

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 4 } }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: 'text.primary',
          fontFamily: theme.typography.fontFamily,
          letterSpacing: -0.4,
        }}
      >
        Explore
      </Typography>

      <SectionRow title="By Country" items={countries} onViewAll={() => {}} />
      <SectionRow title="By Genre" items={genres} onViewAll={() => {}} />
      <SectionRow title="By Mood" items={moods} onViewAll={() => {}} />
    </Box>
  );
}
