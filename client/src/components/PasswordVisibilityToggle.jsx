import IconButton from '@mui/material/IconButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

export default function PasswordVisibilityToggle({ show, onClick, sx = {}, ariaLabel = 'Toggle password visibility', ...rest }) {
  return (
    <IconButton
      size="small"
      onClick={onClick}
      aria-label={ariaLabel}
      sx={{ cursor: 'pointer', p: 0, ...sx }}
      {...rest}
    >
      <FontAwesomeIcon icon={show ? faEyeSlash : faEye} />
    </IconButton>
  );
}
