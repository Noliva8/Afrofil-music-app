import './CSS/plan.css';
import React, { useState } from 'react';
import ArtistAuth from '../utils/artist_auth';
import { useNavigate } from 'react-router-dom';
import { SitemarkIcon } from '../components/themeCustomization/customIcon';
import { useMutation } from '@apollo/client';
import { SELECT_PLAN } from '../utils/mutations';
import Button from '@mui/material/Button';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

// Plan Data
const plans = [
  {
    title: 'Free Plan',
    description: 'Kickstart your music career with tools to share your songs and connect with fans. Ideal for musicians and songwriters starting out.',
    benefits: [
      'Upload unlimited songs (up to 15MB per song, MP3 format)',
      'Basic analytics to track plays and audience growth',
      'Customizable artist page with a unique Afrofeel URL',
      'Featured exposure for your latest uploads',
      'Join an artist community for collaboration and support',
      'Access educational tips to grow your music career',
      'Fan "like" system with monthly shoutouts to top listeners',
    ],
    price: 'Free forever',
  },
  {
    title: 'Premium Plan',
    description: 'Elevate your music career with powerful tools to monetize, promote, and connect. Designed for serious creators and small labels ready to make their mark.',
    benefits: [
      'Upload unlimited songs and albums (up to 20MB per audio file for high-quality sound)',
      'Share video highlights (up to 30 seconds) to captivate your fans',
      'Receive 100% of tips from fans with our "Buy Me Coffee" feature',
      'Send and receive files up to 50GB with Afrofeel File Share',
      'Access local and global promotion tools to boost visibility',
      'Priority placement on Afrofeel’s Featured Artist lists',
      'Detailed analytics to track fan engagement and revenue growth',
      'Apply for inclusion in Afrofeel-curated cultural playlists',
      'Connect with collaborators and fans through exclusive community features',
    ],
    price: '$4 per month',
  },
  {
    title: 'Pro Plan',
    description: 'Unlock advanced tools and exclusive features to take your music career to the next level. Perfect for labels, studios, and professional artists who want maximum exposure and seamless collaboration.',
    benefits: [
      'Everything in the Premium Plan, plus:',
      'Upload files up to 200MB per song for studio-quality sound',
      'Send and receive files up to 200GB with Afrofeel File Share',
      'Connect with investors and other artists for collaboration opportunities',
      'Priority placement in Afrofeel-curated playlists and Featured Artist lists',
      'Run targeted promotion campaigns to grow your audience',
      'Access advanced analytics with revenue tracking and growth insights',
      'Create custom promotional links to drive fan engagement',
      'Dedicated support team for professional guidance and troubleshooting',
      'Exclusive access to Afrofeel live showcases and virtual events',
    ],
    price: '$12 per month',
  },
];

// Plan Selection Component
const PlanSelection = () => {
  const [selectPlan] = useMutation(SELECT_PLAN);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // For handling loading state during plan selection
  const [showLogout, setShowLogout] = useState(false);

  // Handle Plan Selection
  const handlePlanSelection = async (plan) => {
    setLoading(true); // Show loading spinner or disable buttons during plan selection

    const profile = ArtistAuth.getProfile();
    if (!profile || !profile.data._id) {
      alert('Artist is not logged in or artist ID is missing.');
      setLoading(false); // Reset loading state on failure
      return;
    }

    const artistId = profile.data._id;

    try {
      const { data } = await selectPlan({
        variables: { artistId, plan },
      });

      console.log(data);

      // Plan Selection Navigation
      if (data.selectPlan.plan === "Free Plan") {
        navigate('/artist/dashboard');
      } else if (data.selectPlan.plan === "Premium Plan") {
        navigate('/artist/dashboard/premium');
      } else if (data.selectPlan.plan === "Pro Plan") {
        navigate('/artist/dashboard/ProPlan');
      } else {
        alert('Failed to select plan. Please try again.');
      }
    } catch (error) {
      console.error('Error selecting plan:', error.message);
      alert('An error occurred while selecting the plan. Please try again.');
    } finally {
      setLoading(false); // Reset loading state after mutation completes
    }
  };

  // Toggle logout display
  function handleLogoutDisplay() {
    setShowLogout((prevState) => !prevState);
  }

  return (
    <>
      <div className='plans'>
        <header className="planHeader">
          <SitemarkIcon />
          <div className="accountContainer">
            <button
              type="button"
              className="accountButton"
              onClick={handleLogoutDisplay}
            >
              <AccountCircleIcon />
            </button>

            {/* Profile / Logout Button */}
            {showLogout && (
              <div className={`profileContainer ${showLogout ? 'show' : ''}`}>
                <button
                  onClick={() => {
                    console.log('Logged out');
                    ArtistAuth.logout(); // Handle logout logic
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main>
          <section>
            <div className='selectPlan'>
              <h1>SELECT PLAN</h1>
              <p>Welcome to Afrofeel! Upload unlimited songs and let your creative energy shine. Whether you're an amateur, professional, or label—choose your plan and start your journey today.</p>
            </div>

            <div className='planCardContainer'>
              {plans.map((plan) => (
                <div className='planCard' key={plan.title}>
                  <div className='planCardHeader'>
                    <h2>{plan.title}</h2>
                  </div>

                  <div className='planCardBenefit'>
                    <p>{plan.description}</p>
                  </div>

                  <div className='planCardPrice'>
                    <h3>{plan.price}</h3>
                  </div>

                  {/* Action - Get Started Button */}
                  <div className='planGetStarted'>
                    <button
                      onClick={() => handlePlanSelection(plan.title)} // Pass plan title to handler
                      disabled={loading} // Disable button during loading
                    >
                      {loading ? 'Processing...' : 'Get Started'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default PlanSelection;
