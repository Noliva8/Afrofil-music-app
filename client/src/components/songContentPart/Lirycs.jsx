
import { useMutation } from "@apollo/client";
import Paper from "@mui/material/Paper";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from "@mui/material/Button";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import { useForm } from "react-hook-form";
import {ADD_LYRICS} from "../../utils/mutations";
import Swal from "sweetalert2";
import { alpha, useTheme } from "@mui/material/styles";








export default function Lyrics ({songId, setActiveStep}) {
const theme = useTheme();

const { register, handleSubmit, formState: { errors } } = useForm();
  const [UpdateSong] = useMutation(ADD_LYRICS);


const onSubmit = async (data) => {

 if (!songId) {
    console.error("🚨 Cannot submit: songId is missing.");
    Swal.fire({
      icon: 'warning',
      title: 'Unexpected error',
      text: 'We are having trouble to add your song lyrics, please reflesh the page and try again',
    });

    setIsSubmitting(false);
    return;
  }

  try{


 const variables = {
  songId: songId,
  lyrics: data.lyrics || '',
};
const response = await UpdateSong({ variables });
setActiveStep(3);
  }
  catch(error){
    console.error("🔥 Error during add lyrics:", error);

   Swal.fire({
      icon: 'error',
      title: 'Update Failed',
      html: `
        <div style="text-align:left">
          <p>${error.message}</p>
          ${error.networkError ? '<small>Please check your connection</small>' : ''}
        </div>
      `
    });

  }


}


  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: "8px",
        bgcolor: alpha(theme.palette.background.paper, 0.88),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
         width: '100%' ,
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Song Lyrics
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Add your lyrics (optional)
      </Typography>

          <form onSubmit={handleSubmit((onSubmit))}>

      <Box sx={{ mt: 2, flexGrow: 1, width: '100%' }}>
        <TextareaAutosize
          {...register("lyrics")}
          minRows={10}
          maxRows={25}
          style={{
            width: '100%' ,
            
            padding: "16px",
            border: errors.lyrics ? "1px solid #d32f2f" : `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            borderRadius: "8px",
            fontFamily: "inherit",
            fontSize: "0.875rem",
            lineHeight: 1.5,
            resize: "vertical",
            backgroundColor: alpha(theme.palette.background.paper, 0.7),
            color: theme.palette.text.primary
          }}
          placeholder="Enter your lyrics here...\n\n[Verse 1]\n...\n\n[Chorus]\n..."
        />
        {errors.lyrics && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
            {errors.lyrics.message}
          </Typography>
        )}
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Tip: Use empty lines to separate sections (e.g., Verse, Chorus)
        </Typography>
      </Box>

            <Button
    variant="contained"
    sx={{
      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
      color: theme.palette.primary.contrastText,
      fontFamily: theme.typography.fontFamily,
      borderRadius: "8px",
      px: 3,
      py: 1.1,
      textTransform: "none",
      fontWeight: 800,
    }}
    type="submit"
  >
    Next
  </Button>
</form>

    </Paper>
  
  );
}
