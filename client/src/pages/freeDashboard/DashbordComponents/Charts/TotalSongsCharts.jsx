import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine, Legend} from 'recharts';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';




let uploadsProgress = [
  
  
];




// Target average line
const targetAverage = 3;

export default function TotalSongCharts({ data, refetch }) {
  return (

 <Box sx={{ width: '100%', height: 220, padding: 3 }}>
  <Typography variant="subtitle1" gutterBottom color="white" sx={{ opacity: 0.5 }}>
    Uploads Over Time
  </Typography>

  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
      
      <XAxis 
        dataKey="date" 
        tick={{ fill: 'white', fontSize: 12,opacity: .5 }} 
      
        tickLine={{ stroke: 'white', opacity: .5 }} 
      />
      
      <YAxis 
        tick={{ fill: 'white', fontSize: 12, opacity: .5 }} 
       
        tickLine={{ stroke: 'white', opacity: .5 }} 
      />

      <Tooltip 
        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }} 
        itemStyle={{ color: 'white' }} 
        labelStyle={{ color: 'white' }} 
      />

      <Legend wrapperStyle={{ color: 'white' }} />
    
      
      <Line type="monotone" dataKey="uploads" stroke="#f07f21" strokeWidth={5} dot={{ r: 4, stroke: 'white', strokeWidth: 1 }} />
    </LineChart>
  </ResponsiveContainer>
</Box>

  );
}
