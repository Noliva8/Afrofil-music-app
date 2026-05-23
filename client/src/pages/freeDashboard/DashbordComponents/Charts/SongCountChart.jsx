import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const truncateTitle = (value = '') => {
  const title = String(value);
  return title.length > 14 ? `${title.slice(0, 13)}...` : title;
};

export default function SongCountChart({ data = [] }) {
  const hasData = data.length > 0;
  return (

    <Box sx={{ width: '100%', height: 220,padding: 3}}>
        
      <Typography variant="subtitle1" gutterBottom color="white" sx={{opacity: .5}}>
        Top 5 Most Played Songs
      </Typography>

      {hasData ? (
        <ResponsiveContainer width="100%" height="100%" >
        <BarChart data={data} layout="vertical">

          <XAxis type="number" 
           tick={{ fill: 'white', fontSize: 12, opacity: .5 }}
          />
          
          <YAxis dataKey="title" type="category"
           width={88}
           tickFormatter={truncateTitle}
           tick={{ fill: 'white', fontSize: 9, opacity: .65 }}
           interval={0}
           />
          <Tooltip formatter={(value) => [value, 'Plays']} labelFormatter={(label) => label} />
          <Bar type="monotone" dataKey="plays" fill="#f07f21" />
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
          <Typography color="white" sx={{ opacity: 0.5 }}>
            No plays yet
          </Typography>
        </Box>
      )}
    </Box>
  );
}
