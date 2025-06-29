

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import PieChart from 'recharts';


export default function TopDownload() {
    return(

    <>




    <Box sx={{ flexGrow: 1 }}>
      {/* Replace with your real chart later */}
      <PieChart width={200} height={200}>
        <Pie
          data={topDownloadedSongsData} // array of { name, value }
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name }) => name}
          outerRadius={80}
          fill="#f07f21"
          dataKey="value"
        >
          {topDownloadedSongsData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </Box>

    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Box sx={{ textAlign: 'right' }}>
        <Typography variant="subtitle1" sx={{ fontSize: '2rem', color: 'white' }}>
         
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '1rem',
            fontStyle: 'italic',
          }}
        >
          total downloads
        </Typography>
      </Box>
    </Box>

</>

    )
}