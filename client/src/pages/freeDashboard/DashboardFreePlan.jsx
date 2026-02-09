import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid2 from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import TotalSongCharts from './DashbordComponents/Charts/totalSongsCharts';
import SongsList from './DashbordComponents/SongList/SongList';
import CountUp from 'react-countup';
import { useQuery } from "@apollo/client";
import { SONG_OF_ARTIST } from '../../utils/queries';
import SongCountChart from './DashbordComponents/Charts/SongCountChart';
import TopLikedSongs from './DashbordComponents/Charts/TopLikeSongs';



export default function DashboardFreePlan() {

 const { data, loading, error, refetch } = useQuery(SONG_OF_ARTIST, {
  fetchPolicy: 'network-only',
});


  const songs = data?.songsOfArtist || [];
console.log(songs)

// build uploads per month
const uploadsPerMonth = {};
songs.forEach(song => {
  const date = new Date(song.createdAt);
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  uploadsPerMonth[key] = (uploadsPerMonth[key] || 0) + 1;
});

// get last 6 months
function getLast6Months() {
  const months = [];
  const today = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push(key);
  }

  return months;
}

const last6Months = getLast6Months();

const chartData = last6Months.map(month => ({
  date: month,
  uploads: uploadsPerMonth[month] || 0
}));

console.log(chartData)
console.log('all songs:', songs);




// Inside DashboardFreePlan before return
const albums = {};
songs.forEach(song => {
  const albumId = song.album?._id || 'no-album';
  if (!albums[albumId]) {
    albums[albumId] = {
      title: song.album?.title || 'Unknown Album',
      songs: []
    };
  }
  albums[albumId].songs.push(song);
});
const albumsArray = Object.values(albums);







function handleEditSong(songId) {
  console.log('Edit song:', songId);
  
}

function handleDeleteSong(songId) {
  console.log('Delete song:', songId);
  // Show confirmation dialog and delete logic here
}




console.log(chartData)




  return (
<Box
  sx={{
    width: "100%",
    height: "100vh",
    marginTop: { xs: "4rem", lg: "2.5rem" },
  }}
>
  <Typography variant="h4" gutterBottom color="white">
    Dashboard
  </Typography>


{/* Grid system 1 */}
{/* -------------- */}

  <Grid2 container spacing={2}>

    {/* Total Songs */}
    <Grid2 size={{ sm: 12, md: 6, lg: 4 }}>

   <Paper
        elevation={3}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--secondary-background-color)",
          p: 3,
          borderRadius: "10px",
          gap: "1rem",
        }}
      >
        <Typography variant="h5" gutterBottom color="white" sx={{ fontWeight: 600 }}>
          Total songs :
        </Typography>

        <Divider sx={{ width: "100%" }} />

        {loading ? (
          <Typography color="white">Loading chart...</Typography>
        ) : error ? (
          <Typography color="red">Error loading songs</Typography>
        ) : (
          <>
       


        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontSize: "3rem", color: "white" }}>
            <CountUp start={0} end={songs.length} duration={3} />
          </Typography>
        </Box>



      

                 <Box sx={{ flexGrow: 1, height: 'auto' }}>
              <TotalSongCharts data={chartData} refetch={refetch} />
            </Box>
          </>
        )}
      </Paper>
    </Grid2>


    {/* Total Play Counts */}
    <Grid2 size={{ sm: 12, md: 6, lg: 4 }}>

      <Paper
        elevation={3}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--secondary-background-color)",
          p: 3,
          borderRadius: "10px",
          gap: "1rem",
        }}
      >
        <Typography variant="h5" gutterBottom color="white" sx={{ fontWeight: 600 }}>
          Total play counts :
        </Typography>

        <Divider sx={{ width: "100%" }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontSize: "3rem", color: "white" }}>
            <CountUp start={0} end={songs.length * 10} duration={3} />
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <SongCountChart />
        </Box>
      </Paper>
    </Grid2>

    {/* Total Likes */}
    <Grid2 size={{ sm: 12, md: 6, lg: 4 }}>
      <Paper
        elevation={3}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--secondary-background-color)",
          p: 3,
          borderRadius: "10px",
          gap: "1rem",
        }}
      >
        <Typography variant="h5" gutterBottom color="white" sx={{ fontWeight: 600 }}>
          Total likes :
        </Typography>

        <Divider sx={{ width: "100%" }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontSize: "3rem", color: "white" }}>
            <CountUp start={0} end={songs.length * 5} duration={3} />
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          {/* You can later add a Likes Chart here */}
             <TopLikedSongs />
        </Box>

     
      </Paper>
    </Grid2>





    {/* Group 2 */}
    <Grid2 size={{ xs: 12, md: 12 }}>
      <Paper
        elevation={3}
        sx={{
          
          backgroundColor: "var(--secondary-background-color)",
          p: 3,
          borderRadius: "10px",
        }}
      >
        <Typography variant="h5" gutterBottom color="white">
          Song list:
        </Typography>
         <Divider sx={{ width: "100%" }} />



<SongsList songs={songs} onEdit={handleEditSong} refetch={refetch} onDelete={handleDeleteSong} />

      </Paper>
    </Grid2>







     <Grid2 size={{ xs: 12, md: 6 }}>
      <Paper
        elevation={3}
        sx={{
          height: "300px",
          backgroundColor: "var(--secondary-background-color)",
          p: 3,
          borderRadius: "10px",
        }}
      >
        <Typography variant="h5" gutterBottom color="white">
          You have songs:
        </Typography>
         <Divider sx={{ width: "100%" }} />

      </Paper>
    </Grid2>



{/* group 3 */}

  <Grid2 size={{ xs: 6, sm: 4, lg: 3}}>
      <Paper
        elevation={3}
        sx={{
          height: "300px",
          backgroundColor: "var(--secondary-background-color)",
          p: 3,
          borderRadius: "10px",
        }}
      >
        <Typography variant="h5" gutterBottom color="white">
          Afrobeat Category:
        </Typography>
         <Divider sx={{ width: "100%" }} />

      </Paper>
    </Grid2>

  <Grid2 size={{ xs: 6, sm: 4, lg: 3}}>
      <Paper
        elevation={3}
        sx={{
          height: "300px",
          backgroundColor: "var(--secondary-background-color)",
          p: 3,
          borderRadius: "10px",
        }}
      >
        <Typography variant="h5" gutterBottom color="white">
          HipHop Category
        </Typography>
         <Divider sx={{ width: "100%" }} />

      </Paper>
    </Grid2>

      <Grid2 size={{ xs: 6, sm: 4, lg: 3}}>
      <Paper
        elevation={3}
        sx={{
          height: "300px",
          backgroundColor: "var(--secondary-background-color)",
          p: 3,
          borderRadius: "10px",
        }}
      >
        <Typography variant="h5" gutterBottom color="white">
          Rock Category:
        </Typography>
         <Divider sx={{ width: "100%" }} />

      </Paper>
    </Grid2>
      <Grid2 size={{ xs: 6, sm: 4, lg: 3}}>
      <Paper
        elevation={3}
        sx={{
          height: "300px",
          backgroundColor: "var(--secondary-background-color)",
          p: 3,
          borderRadius: "10px",
        }}
      >
        <Typography variant="h5" gutterBottom color="white">
          You have songs:
        </Typography>
         <Divider sx={{ width: "100%" }} />

      </Paper>
    </Grid2>



    {/* Group 4 */}



    {/* Total downloads */}
    <Grid2 size={{ sm: 12, md: 6, lg: 4 }}>

   <Paper
        elevation={3}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--secondary-background-color)",
          p: 3,
          borderRadius: "10px",
          gap: "1rem",
        }}
      >
        <Typography variant="h5" gutterBottom color="white" sx={{ fontWeight: 600 }}>
          Total songs :
        </Typography>

        <Divider sx={{ width: "100%" }} />

        {loading ? (
          <Typography color="white">Loading chart...</Typography>
        ) : error ? (
          <Typography color="red">Error loading songs</Typography>
        ) : (
          <>
       


        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontSize: "3rem", color: "white" }}>
            <CountUp start={0} end={songs.length} duration={3} />
          </Typography>
        </Box>



      

                 <Box sx={{ flexGrow: 1, height: 'auto' }}>
              <TotalSongCharts data={chartData} />
            </Box>
          </>
        )}
      </Paper>
    </Grid2>


    {/* Total Play Counts */}
    <Grid2 size={{ sm: 12, md: 6, lg: 4 }}>

      <Paper
        elevation={3}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--secondary-background-color)",
          p: 3,
          borderRadius: "10px",
          gap: "1rem",
        }}
      >
        <Typography variant="h5" gutterBottom color="white" sx={{ fontWeight: 600 }}>
          Total play counts :
        </Typography>

        <Divider sx={{ width: "100%" }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontSize: "3rem", color: "white" }}>
            <CountUp start={0} end={songs.length * 10} duration={3} />
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }}>
       
        </Box>
      </Paper>
    </Grid2>

    {/* Total Likes */}
    <Grid2 size={{ sm: 12, md: 6, lg: 4 }}>
      <Paper
        elevation={3}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--secondary-background-color)",
          p: 3,
          borderRadius: "10px",
          gap: "1rem",
        }}
      >
        <Typography variant="h5" gutterBottom color="white" sx={{ fontWeight: 600 }}>
          Total likes :
        </Typography>

        <Divider sx={{ width: "100%" }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontSize: "3rem", color: "white" }}>
            <CountUp start={0} end={songs.length * 5} duration={3} />
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          {/* You can later add a Likes Chart here */}
             <TopLikedSongs />
        </Box>

     
      </Paper>
    </Grid2>

    
  </Grid2>
</Box>

  );
}