import { useRef } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography'
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NextButton from './NextButton';
import ShowAllButton from './ShowAllButton';


export function SectionHeaderSlide({ title = '🔥 Trending Now', scrollerRef, handleSlide, handleShowAll}) {




return(
   <Box display='flex' justifyContent='space-between' alignItems='center' width='100%'  >
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.5,
          fontSize: { xs: "1.5rem", md: "2.5rem" },
         color: 'var( --primary-font-color)'
        }}
      >
        🔥 Trending Now
      </Typography>
{/* 
     <NextButton  handleSlide={handleSlide} /> */}
<ShowAllButton handleShowAll={handleShowAll}/>
     

      </Box> 

)

}
