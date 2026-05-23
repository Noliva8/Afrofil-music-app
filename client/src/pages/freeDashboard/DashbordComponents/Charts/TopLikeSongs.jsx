import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const truncateTitle = (value = '') => {
  const title = String(value);
  return title.length > 14 ? `${title.slice(0, 13)}...` : title;
};

export default function TopLikedSongs({ data = [] }) {
  const hasData = data.length > 0;

  return (

<>
 <Box sx={{ width: '100%', height: 220, padding: 3 }}>

     <Typography variant="subtitle1" gutterBottom color="white" sx={{ opacity: 0.5 }}>
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
              
              tick={{ fill: 'white', fontSize: 12, opacity: .5 }}
            />

            <YAxis
              dataKey="title"
              type="category"
              width={88}
              tickFormatter={truncateTitle}
              tick={{ fill: 'white', fontSize: 9, opacity: .65 }}
              interval={0}
            />
            <Tooltip
              formatter={(value) => [value, 'Likes']}
              labelFormatter={(label) => label}
            />
            <Bar dataKey="likes" type="monotone" fill="#f07f21" />
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
              No liked songs yet
            </Typography>
          </Box>
        )}
  

 </Box>


   
    </>
  );
}
