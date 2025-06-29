import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation } from "@apollo/client";
import Swal from "sweetalert2";

import Fade from "@mui/material/Fade";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextareaAutosize from "@mui/material/TextareaAutosize";

import { ADD_LYRICS } from "../../../../../utils/mutations";
import { SONG_OF_ARTIST } from "../../../../../utils/queries";

export default function LyricsEditSong({ songId, song, setActiveStep }) {
  // 1️⃣ Hook up RHF
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { lyrics: song?.lyrics || "" },
  });

  // 2️⃣ Reset whenever `song.lyrics` changes
  useEffect(() => {
    console.log("💡 received song:", song);
    reset({ lyrics: song?.lyrics || "" });
  }, [song, reset]);

  // 3️⃣ Mutation with cache update
  const [addLyrics, { loading }] = useMutation(ADD_LYRICS, {
    refetchQueries: [{ query: SONG_OF_ARTIST }],
  });

  // 4️⃣ On submit
  const onSubmit = async ({ lyrics }) => {
    if (!songId) {
      Swal.fire({
        icon: "warning",
        title: "Missing song",
        text: "Couldn’t find the song—please refresh and try again.",
      });
      return;
    }

    try {
      await addLyrics({ variables: { songId, lyrics } });
      setActiveStep((s) => s + 1);
    } catch (err) {
      console.error("🔥 Error updating lyrics:", err);
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
          p: 3,
          borderRadius: 2,
          bgcolor: "background.paper",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Song Lyrics
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Add or edit your lyrics (optional)
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
        >
          <Controller
            name="lyrics"
            control={control}
            render={({ field }) => (
              <TextareaAutosize
                {...field}
                minRows={10}
                maxRows={25}
                placeholder={`[Verse 1]\n...\n\n[Chorus]\n...`}
                style={{
                  flex: 1,
                  width: "100%",
                  padding: 16,
                  border: errors.lyrics
                    ? "1px solid #d32f2f"
                    : "1px solid #ced4da",
                  borderRadius: 4,
                  fontFamily: "inherit",
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                  resize: "vertical",
                }}
              />
            )}
          />
          {errors.lyrics && (
            <Typography variant="caption" color="error" sx={{ mt: 1 }}>
              {errors.lyrics.message}
            </Typography>
          )}

          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "Saving…" : "Next"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
}
