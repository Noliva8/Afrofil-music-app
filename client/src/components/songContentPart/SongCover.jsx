import { useState } from 'react';
import Button from '@mui/material/Button';
import { useForm } from "react-hook-form";
import { useMutation } from "@apollo/client";
import {ADD_ARTWORK} from "../../utils/mutations";
import Swal from "sweetalert2";
import { useNavigate } from 'react-router-dom';

import {
  Paper,
  Box,
  Typography,
  IconButton,
  CircularProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';





const SongCover = ({ 
  setActiveStep,
   songId,
  currentImageUrl,
  onUpload,
  onDelete,
  isLoading
}) => {

const navigate = useNavigate();

const {  handleSubmit, formState: { errors } } = useForm();
  const [addArtwork] = useMutation(ADD_ARTWORK);


  const [tempPreview, setTempPreview] = useState('');


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create and set temporary preview
    const previewUrl = URL.createObjectURL(file);
    setTempPreview(previewUrl);

    // Upload to S3
    onUpload(file)
      .then(() => {
        // Clean up temporary preview after successful upload
        URL.revokeObjectURL(previewUrl);
        setTempPreview('');
      })
      .catch(() => {
        // Keep preview on error
      });
  };

  // Display priority: Final URL > Temporary preview
  const displayUrl = currentImageUrl || tempPreview;




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

   navigate('/artist/studio/dashboard');
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
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Album Artwork
      </Typography>
      
      <form onSubmit={handleSubmit((onSubmit))} >
      <Box sx={{ 
        border: '2px dashed', 
        borderColor: 'divider', 
        borderRadius: 1,
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
                  sx={{ mt: 2 }}
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
    color: 'var(--primary-background-color)',
    backgroundColor: 'var(--primary-font-color)',
    fontFamily: 'Roboto',
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