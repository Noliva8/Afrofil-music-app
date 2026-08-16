import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const truncateTitle = (value = '') => {
  const title = String(value);
  return title.length > 14 ? `${title.slice(0, 13)}...` : title;
};

export default function TopLikedSongs({ data = [] }) {
  const theme = useTheme();
  const hasData = data.length > 0;
  const mutedText = alpha(theme.palette.text.primary, 0.62);

  return (

<>
 <Box sx={{ width: '100%', height: 220, p: { xs: 1, sm: 2, md: 3 } }}>

     <Typography variant="subtitle1" gutterBottom sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>
    Top 5 Most Liked Songs
  </Typography>

        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
          >
            

            <XAxis
              type="number"
              
              tick={{ fill: mutedText, fontSize: 12 }}
            />

            <YAxis
              dataKey="title"
              type="category"
              width={88}
              tickFormatter={truncateTitle}
              tick={{ fill: mutedText, fontSize: 9 }}
              interval={0}
            />
            <Tooltip
              formatter={(value) => [value, 'Likes']}
              labelFormatter={(label) => label}
              contentStyle={{
                backgroundColor: alpha(theme.palette.background.paper, 0.96),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: 8,
              }}
              itemStyle={{ color: theme.palette.text.primary }}
              labelStyle={{ color: theme.palette.text.primary }}
            />
            <Bar dataKey="likes" type="monotone" fill={theme.palette.primary.main} />
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
              No liked songs yet
            </Typography>
          </Box>
        )}
  

 </Box>


   
    </>
  );
}
