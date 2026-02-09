
import { FiX, FiMusic, FiDownload, FiHeadphones } from 'react-icons/fi';
import { BsStars } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import './PremiumPromoModal.css';

const PremiumPromoModal = ({ onClose }) => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: <FiMusic size={24} />,
      title: "Ad-Free Music",
      description: "Enjoy uninterrupted listening without ads"
    },
    {
      icon: <FiDownload size={24} />,
      title: "Offline Listening",
      description: "Download your favorite tracks and playlists"
    },
    {
      icon: <FiHeadphones size={24} />,
      title: "High Quality Audio",
      description: "Experience crystal clear sound quality"
    },
    {
      icon: <BsStars size={24} />,
      title: "Exclusive Content",
      description: "Access to premium-only tracks and playlists"
    }
  ];

  const handleGetStarted = () => {
    navigate('/checkout');
    onClose();
  };

  return (
    
    <div className="promo-modal-overlay">
      <div className="promo-modal-container">
        <button className="close-btn" onClick={onClose}>
          <FiX size={24} />
        </button>

        <div className="promo-header">
          <div className="premium-badge">
            <BsStars size={32} />
            <span>PREMIUM</span>
          </div>
          <h2>Elevate Your Music Experience</h2>
          <p className="trial-offer">Try 1 month free, then ${8}/month</p>
        </div>

        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div key={index} className="benefit-card">
              <div className="benefit-icon">{benefit.icon}</div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          ))}
        </div>

        <button 
          className="get-started-btn"
          onClick={handleGetStarted}
        >
          Get Started
        </button>

        <div className="terms-notice">
          <p>
            By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            Cancel anytime before your trial ends to avoid being charged.
          </p>
        </div>
      </div>
    </div>


  );
};

export default PremiumPromoModal;