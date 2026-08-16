import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

const truncateTitle = (value = '') => {
  const title = String(value);
  return title.length > 14 ? `${title.slice(0, 13)}...` : title;
};

export default function SongCountChart({ data = [] }) {
  const theme = useTheme();
  const hasData = data.length > 0;
  const mutedText = alpha(theme.palette.text.primary, 0.62);

  return (

    <Box sx={{ width: '100%', height: 220, p: { xs: 1, sm: 2, md: 3 } }}>
        
      <Typography variant="subtitle1" gutterBottom sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>
        Top 5 Most Played Songs
      </Typography>

      {hasData ? (
        <ResponsiveContainer width="100%" height="100%" >
        <BarChart data={data} layout="vertical">

          <XAxis type="number" 
           tick={{ fill: mutedText, fontSize: 12 }}
          />
          
          <YAxis dataKey="title" type="category"
           width={88}
           tickFormatter={truncateTitle}
           tick={{ fill: mutedText, fontSize: 9 }}
           interval={0}
           />
          <Tooltip
            formatter={(value) => [value, 'Plays']}
            labelFormatter={(label) => label}
            contentStyle={{
              backgroundColor: alpha(theme.palette.background.paper, 0.96),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderRadius: 8,
            }}
            itemStyle={{ color: theme.palette.text.primary }}
            labelStyle={{ color: theme.palette.text.primary }}
          />
          <Bar type="monotone" dataKey="plays" fill={theme.palette.primary.main} />
        </BarChart>
      </ResponsiveContainer>
      ) : (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ color: theme.palette.text.secondary }}>
            No plays yet
          </Typography>
        </Box>
      )}
    </Box>
  );
}
