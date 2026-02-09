import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import MetadataEdit from './MetadataEdit';


export default function EditModal({ open, onClose, song, refetch  }) {



  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          bgcolor: 'var(--primary-background-color)',
          p: 2,
          overflowY: 'auto',
        }}
      >
        {/* Close Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>

        </Box>

        <MetadataEdit
  key={song?._id}
  song={song}
   refetch={refetch}
   onClose={onClose}
/>

      </Box>
    </Modal>
  );
}
