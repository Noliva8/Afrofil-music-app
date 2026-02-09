
import { useNavigate } from 'react-router-dom'; 
import '../pages/CSS/forArtistOnly.css';

const ForArtistOnly = () => {
  const navigate = useNavigate();

  const handleArtistSignupFormDisplay = () => {
    navigate('/artist/register'); 
  };

  return (
    <div>
      <button
        type="button"
        className="forArtistOnly"
        onClick={handleArtistSignupFormDisplay}
      >
        Artist? Sign up here
      </button>
    </div>
  );
};

export default ForArtistOnly;
