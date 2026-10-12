import { useState, startTransition } from 'react';
import Button from '@mui/material/Button';
import { useForm } from "react-hook-form";
import { useMutation } from "@apollo/client";
import {ADD_ARTWORK} from "../../utils/mutations";
import Swal from "sweetalert2";
import { useNavigate } from 'react-router-dom';

import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { alpha, useTheme } from '@mui/material/styles';





const SongCover = ({ 
   songId,
  currentImageUrl,
  onUpload,
  onDelete,
  isLoading
}) => {
const theme = useTheme();

const navigate = useNavigate();

const { handleSubmit } = useForm();
  const [addArtwork] = useMutation(ADD_ARTWORK);


  const [uploadError, setUploadError] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setUploadError('');

    onUpload(file).catch(() => {
      setUploadError('Artwork upload failed. Please try again.');
    });
  };

  const hasUploadedArtwork = Boolean(currentImageUrl);

  const handleDelete = () => {
    setSelectedFileName('');
    setUploadError('');
    onDelete?.();
  };




  // update the server


  const onSubmit = async () => {

 if (!songId) {
    console.error("🚨 Cannot submit: songId is missing.");
    Swal.fire({
      icon: 'warning',
      title: 'Unexpected error',
      text: 'We are having trouble to add your song lyrics, please reflesh the page and try again',
    });
    return;
  }

  try{

 const variables = {
  songId: songId,
  artwork: currentImageUrl,

};

await addArtwork({ variables });


    await Swal.fire({
      icon: 'success',
      title: 'Song Updated!',
      html: `
        <div style="text-align:center">
          <p> your song has been published</p>
          <small>Now available in your library</small>
        </div>
      `
    });

   startTransition(() => navigate('/artist/studio/dashboard'));
  }
  catch(error){
    console.error("🔥 Error during adding artwork:", error);

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
      }}
    >
      <Typography variant="h6" gutterBottom>
        Song artwork
      </Typography>
      
      <form onSubmit={handleSubmit((onSubmit))} >
      <Box sx={{ 
        border: '2px dashed', 
        borderColor: alpha(theme.palette.primary.main, 0.32), 
        borderRadius: "8px",
        p: 4,
        textAlign: 'center',
        position: 'relative',
        minHeight: 300
      }}>
        {hasUploadedArtwork ? (
          <Box
            sx={{
              minHeight: 220,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
            }}
          >
            <CheckCircleOutlineIcon sx={{ fontSize: 64, color: "success.main" }} />
            <Typography variant="h6" sx={{ color: "success.main", fontWeight: 800 }}>
              Artwork uploaded
            </Typography>
            {selectedFileName && (
              <Typography variant="body2" sx={{ color: "text.secondary", wordBreak: "break-word" }}>
                {selectedFileName}
              </Typography>
            )}
            <IconButton
              onClick={handleDelete}
              disabled={isLoading}
              aria-label="Remove uploaded artwork"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'error.main', color: 'white' }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ) : (
          <>
            {isLoading ? (
              <Box
                sx={{
                  minHeight: 220,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                }}
              >
                <CircularProgress size={48} />
                <Typography variant="body1" sx={{ color: "text.primary", fontWeight: 700 }}>
                  Uploading artwork...
                </Typography>
                {selectedFileName && (
                  <Typography variant="body2" sx={{ color: "text.secondary", wordBreak: "break-word" }}>
                    {selectedFileName}
                  </Typography>
                )}
              </Box>
            ) : (
              <>
                {uploadError ? (
                  <>
                    <ErrorOutlineIcon sx={{ fontSize: 56, color: "error.main" }} />
                    <Typography variant="body1" sx={{ color: "error.main", fontWeight: 800, mt: 1 }}>
                      Artwork not uploaded
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                      {uploadError}
                    </Typography>
                  </>
                ) : (
                  <ImageIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                )}
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    mt: 2,
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 800,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    color: theme.palette.primary.contrastText,
                  }}
                  disabled={isLoading}
                >
                  Upload Cover
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png" 
                    hidden 
                    onChange={handleFileChange}
                  />
                </Button>
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  JPEG or PNG, max 10MB
                </Typography>
              </>
            )}
          </>
        )}
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
    mt: 2,
    textTransform: "none",
    fontWeight: 800,
  }}
  type="submit"
  disabled={isLoading || !currentImageUrl} 
>
  {isLoading ? "Uploading..." : "Finish"}
</Button>


      </form>
    </Paper>
  );
};

export default SongCover;
