import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend} from 'recharts';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';




let uploadsProgress = [
  
  
];




// Target average line
const targetAverage = 3;

export default function TotalSongCharts({ data, refetch }) {
  const theme = useTheme();
  const mutedText = alpha(theme.palette.text.primary, 0.58);

  return (

 <Box sx={{ width: '100%', height: 220, p: { xs: 1, sm: 2, md: 3 } }}>
  <Typography variant="subtitle1" gutterBottom sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>
    Uploads Over Time
  </Typography>

  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
      
      <XAxis 
        dataKey="date" 
        tick={{ fill: mutedText, fontSize: 12 }} 
      
        tickLine={{ stroke: mutedText }} 
      />
      
      <YAxis 
        tick={{ fill: mutedText, fontSize: 12 }} 
       
        tickLine={{ stroke: mutedText }} 
      />

      <Tooltip 
        contentStyle={{
          backgroundColor: alpha(theme.palette.background.paper, 0.96),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          borderRadius: 8,
        }} 
        itemStyle={{ color: theme.palette.text.primary }} 
        labelStyle={{ color: theme.palette.text.primary }} 
      />

      <Legend wrapperStyle={{ color: theme.palette.text.secondary }} />
    
      
      <Line type="monotone" dataKey="uploads" stroke={theme.palette.primary.main} strokeWidth={5} dot={{ r: 4, stroke: theme.palette.common.white, strokeWidth: 1 }} />
    </LineChart>
  </ResponsiveContainer>
</Box>

  );
}
