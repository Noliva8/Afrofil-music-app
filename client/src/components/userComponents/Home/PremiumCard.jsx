
import { BsStarFill } from 'react-icons/bs';

const PremiumCard = ({ upgradeToPremium }) => {
  return (
    <section className="premium-card" onClick={upgradeToPremium}>
      <div className="premium-badge">
        <BsStarFill />
        <span>Premium</span>
      </div>
      <h2>Elevate Your Experience</h2>
      <p>Unlock ad-free listening, offline mode, and premium content</p>
      <button className="upgrade-btn">Upgrade Now</button>
    </section>
  );
};

export default PremiumCard;
