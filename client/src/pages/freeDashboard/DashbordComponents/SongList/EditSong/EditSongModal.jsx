import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { alpha, useTheme } from '@mui/material/styles';
import MetadataEdit from './MetadataEdit';


export default function EditModal({ open, onClose, song, refetch  }) {
  const theme = useTheme();



  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          bgcolor: theme.palette.background.default,
          p: 2,
          overflowY: 'auto',
        }}
      >
        {/* Close Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton
            onClick={onClose}
            sx={{
              color: theme.palette.text.secondary,
              bgcolor: alpha(theme.palette.background.paper, 0.82),
              border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
              "&:hover": {
                color: theme.palette.text.primary,
                bgcolor: alpha(theme.palette.background.paper, 0.96),
              },
            }}
          >
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
