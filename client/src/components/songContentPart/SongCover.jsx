import { useState, useRef, useEffect, startTransition } from 'react';
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
import { alpha, useTheme } from '@mui/material/styles';





const SongCover = ({ 
  setActiveStep,
   songId,
  currentImageUrl,
  onUpload,
  onDelete,
  isLoading
}) => {
const theme = useTheme();

const navigate = useNavigate();

const {  handleSubmit, formState: { errors } } = useForm();
  const [addArtwork] = useMutation(ADD_ARTWORK);


  const [tempPreview, setTempPreview] = useState('');
  const previewRef = useRef('');


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create and set temporary preview
    const previewUrl = URL.createObjectURL(file);
    previewRef.current = previewUrl;
    setTempPreview(previewUrl);

    // Upload to S3
    onUpload(file).catch(() => {
      // Keep preview on error
    });
  };

  // Display priority: Final URL > Temporary preview
  const displayUrl = currentImageUrl || tempPreview;

  useEffect(() => {
    if (tempPreview && currentImageUrl) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = "";
      setTempPreview("");
    }
  }, [currentImageUrl, tempPreview]);




  // update the server


  const onSubmit = async (data) => {

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

const response = await addArtwork({ variables });


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
        {displayUrl ? (
          <>
            <img 
              src={displayUrl} 
              alt="Album cover" 
              style={{ 
                maxHeight: 250,
                maxWidth: '100%',
                borderRadius: 4,
                objectFit: 'contain'
              }}
              onError={() => setTempPreview('')}
            />
            <IconButton
              onClick={onDelete}  // Use onDelete directly
              disabled={isLoading}
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
          </>
        ) : (
          <>
            {isLoading ? (
              <CircularProgress size={48} />
            ) : (
              <>
                <ImageIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
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
