import React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Example dummy data
const dummyLikesData = [
  { title: 'Song A', likes: 120 },
  { title: 'Song B', likes: 98 },
  { title: 'Song C', likes: 75 },
  { title: 'Song D', likes: 66 },
  { title: 'Song E', likes: 50 },
];

const COLORS = ['#f07f21', '#FFBB28', '#00C49F', '#0088FE', '#FF6666'];

export default function TopLikedSongs({ data = dummyLikesData }) {
  return (

<>
 <Box sx={{ width: '100%', height: 220, padding: 3 }}>

     <Typography variant="subtitle1" gutterBottom color="white" sx={{ opacity: 0.5 }}>
    Top 5 Most Liked Songs
  </Typography>

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
              
              tick={{ fill: 'white', fontSize: 12, opacity: .5 }}
            />
            <Tooltip
              
            />
            <Bar dataKey="likes" type="monotone" fill="#f07f21" />
          </BarChart>
        </ResponsiveContainer>
  

 </Box>


   
    </>
  );
}
