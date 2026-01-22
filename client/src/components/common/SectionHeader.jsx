import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';

const accentStyles = {
  width: 4,
  height: 32,
  borderRadius: 2,
  background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 100%)',
};

const titleStyles = {
  fontWeight: 900,
  fontFamily: "'Inter', sans-serif",
  background: 'linear-gradient(45deg, #FFD700 30%, #FFA500 90%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  fontSize: { xs: '1.5rem', sm: '1.75rem' },
  letterSpacing: '-0.5px',
};

export default function SectionHeader({ title, subtitle, actionLabel, onAction }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4,
        px: { xs: 1, sm: 2 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={accentStyles} />
        <Box>
          <Typography variant="h5" sx={titleStyles}>
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.875rem',
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {actionLabel && onAction && (
        <IconButton
          onClick={onAction}
          sx={{
            color: '#E4C421',
            px: { xs: 1, sm: 1.2 },
            '&:hover': {
              backgroundColor: 'rgba(228, 196, 33, 0.1)',
            },
          }}
        >
          <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            {actionLabel}
          </Typography>
        </IconButton>
      )}
    </Box>
  );
}
