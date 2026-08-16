import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme } from '@mui/material/styles';

export default function SectionHeader({ title, subtitle, actionLabel, onAction }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2.5,
        px: { xs: 1, sm: 2 },
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
        <Box
          sx={{
            width: 4,
            height: 28,
            borderRadius: 2,
            flexShrink: 0,
            background: `linear-gradient(180deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              color: theme.palette.text.primary,
              fontSize: { xs: '1.2rem', sm: '1.45rem', md: '1.6rem' },
              letterSpacing: 0,
              lineHeight: 1.15,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: alpha(theme.palette.text.primary, 0.62),
                fontSize: { xs: '0.78rem', sm: '0.86rem' },
                fontWeight: 500,
                letterSpacing: 0,
                display: { xs: 'none', sm: 'block' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
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
            color: theme.palette.text.primary,
            px: { xs: 1, sm: 1.2 },
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.common.white, 0.06),
            '&:hover': {
              backgroundColor: alpha(theme.palette.common.white, 0.1),
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
