import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation } from "@apollo/client";
import Swal from "sweetalert2";
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Fade from '@mui/material/Fade';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextareaAutosize from '@mui/material/TextareaAutosize';

import { ADD_LYRICS } from "../../../../../utils/mutations";
import { SONG_OF_ARTIST } from "../../../../../utils/queries";

export default function LyricsEditSong({ songId, song, setActiveStep, activeStep }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { lyrics: song?.lyrics || "" },
  });

  useEffect(() => {
    reset({ lyrics: song?.lyrics || "" });
  }, [song, reset]);

  const [addLyrics, { loading }] = useMutation(ADD_LYRICS, {
    refetchQueries: [{ query: SONG_OF_ARTIST }],
  });

  const onSubmit = async ({ lyrics }) => {
    if (!songId) {
      Swal.fire({
        icon: "warning",
        title: "Missing song",
        text: "Couldn't find the song—please refresh and try again.",
      });
      return;
    }

    try {
      await addLyrics({ variables: { songId, lyrics } });
      setActiveStep((s) => s + 1);
    } catch (err) {
      console.error("Error updating lyrics:", err);
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: err.message || "Something went wrong.",
      });
    }
  };

  return (
    <Fade in timeout={300}>
      <Paper
        elevation={3}
        sx={{
          p: isMobile ? 2 : 3,
          borderRadius: "8px",
          bgcolor: alpha(theme.palette.background.paper, 0.9),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          boxShadow: theme.shadows[2],
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          maxWidth: isMobile ? '100%' : '800px',
          mx: 'auto'
        }}
      >
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          gutterBottom 
          sx={{ 
            fontWeight: 600,
            color: theme.palette.text.primary
          }}
        >
          Song Lyrics
        </Typography>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          gutterBottom
          sx={{ mb: 2 }}
        >
          Add or edit your lyrics (optional)
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ 
            flexGrow: 1, 
            display: "flex", 
            flexDirection: "column",
            gap: 2
          }}
        >
          <Controller
            name="lyrics"
            control={control}
            render={({ field }) => (
              <TextareaAutosize
                {...field}
                minRows={isMobile ? 8 : 12}
                maxRows={isMobile ? 20 : 25}
                placeholder={`[Verse 1]\n...\n\n[Chorus]\n...`}
                style={{
                  flex: 1,
                  width: "100%",
                  padding: isMobile ? 12 : 16,
                  border: errors.lyrics
                    ? `1px solid ${theme.palette.error.main}`
                    : `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  borderRadius: 8,
                  fontFamily: theme.typography.fontFamily,
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                  resize: "vertical",
                  backgroundColor: alpha(theme.palette.background.paper, 0.7),
                  color: theme.palette.text.primary,
                }}
              />
            )}
          />
          
          {errors.lyrics && (
            <Typography variant="caption" color="error" sx={{ mt: -1 }}>
              {errors.lyrics.message}
            </Typography>
          )}

          <Box 
            sx={{ 
              display: "flex", 
              justifyContent: "space-between",
              gap: 2,
              flexDirection: isMobile ? 'column-reverse' : 'row'
            }}
          >
            <Button 
              variant="outlined" 
              onClick={() => setActiveStep(activeStep - 1)}
              fullWidth={isMobile}
              sx={{
                borderColor: alpha(theme.palette.primary.main, 0.45),
                color: theme.palette.text.primary,
                "&:hover": {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              Back
            </Button>
            
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              fullWidth={isMobile}
              sx={{
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                color: theme.palette.primary.contrastText,
                borderRadius: "8px",
                fontWeight: 800,
                '&:hover': {
                  background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                }
              }}
            >
              {loading ? "Saving..." : "Save & Continue"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
}
