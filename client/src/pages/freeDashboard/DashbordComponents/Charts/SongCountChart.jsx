import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const dummyData = [
  { title: 'Song A', plays: 3200 },
  { title: 'Song B', plays: 2500 },
  { title: 'Song C', plays: 180 },
  { title: 'Song D', plays: 150 },
  { title: 'Song E', plays: 1200 },
];



export default function SongCountChart() {
  return (

    <Box sx={{ width: '100%', height: 220,padding: 3}}>
        
      <Typography variant="subtitle1" gutterBottom color="white" sx={{opacity: .5}}>
        Top 5 Most Played Songs
      </Typography>

      <ResponsiveContainer width="100%" height="100%" >
        <BarChart data={dummyData} layout="vertical">

          <XAxis type="number" 
           tick={{ fill: 'white', fontSize: 12, opacity: .5 }}
          />
          
          <YAxis dataKey="title" type="category"
           
           tick={{ fill: 'white', fontSize: 12, opacity: .5 }}
           />
          <Tooltip />
          <Bar type="monotone" dataKey="plays" fill="#f07f21" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
