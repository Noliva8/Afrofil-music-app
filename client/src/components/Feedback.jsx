// Feedback.js
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';


const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  backgroundColor: "#1A1A1A",
  borderRadius: '12px',
  boxShadow: "0 2px 2px rgba(228, 196, 33, 0.3)",
  padding: '32px', // use px instead of shorthand 'p: 4' just to be sure
  color: '#fff', // make text readable if background is semi-transparent
  backdropFilter: 'blur(2px)', 
};



export default function Feedback({ open, onClose, title, message }) {
  return (
    <Modal
    className='feedbackContainer'
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          {title}
        </Typography>
        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
          {message}
        </Typography>
      </Box>
    </Modal>
  );
}
