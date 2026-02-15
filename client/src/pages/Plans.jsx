import './CSS/plan.css';
import { useState } from 'react';
import ArtistAuth from '../utils/artist_auth';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useApolloClient } from '@apollo/client';
import { SELECT_PLAN } from '../utils/mutations';
import AppNavBar from '../components/AppNavbar';
import { CREATE_ALBUM } from '../utils/mutations';
import { GET_ALBUM } from '../utils/queries';

// Plan Data
const plans = [
  {
    title: 'Free Plan',
    description: 'Kickstart your music career with tools to share your songs and connect with fans. Ideal for musicians and songwriters starting out.',
    benefits: [
      'Upload unlimited songs (up to 15MB per song, MP3 format)',
      'Basic analytics to track plays and audience growth',
      'Customizable artist page with a unique FloLup URL',
      'Featured exposure for your latest uploads',
      'Join an artist community for collaboration and support',
      'Access educational tips to grow your music career',
      'Fan "like" system with monthly shoutouts to top listeners',
    ],
    price: 'Free forever',
    locked: false,
  },
  {
    title: 'Premium Plan',
    description: 'Elevate your music career with powerful tools to monetize, promote, and connect. Designed for serious creators and small labels ready to make their mark.',
    benefits: [
      'Upload unlimited songs and albums (up to 20MB per audio file for high-quality sound)',
      'Share video highlights (up to 30 seconds) to captivate your fans',
      'Receive 100% of tips from fans with our "Buy Me Coffee" feature',
      'Send and receive files up to 50GB with FloLup File Share',
      'Access local and global promotion tools to boost visibility',
      'Priority placement on FloLup’s Featured Artist lists',
      'Detailed analytics to track fan engagement and revenue growth',
      'Apply for inclusion in FloLup-curated cultural playlists',
      'Connect with collaborators and fans through exclusive community features',
    ],
    price: '$4 per month',
    locked: true,
  },
  {
    title: 'Pro Plan',
    description: 'Unlock advanced tools and exclusive features to take your music career to the next level. Perfect for labels, studios, and professional artists who want maximum exposure and seamless collaboration.',
    benefits: [
      'Everything in the Premium Plan, plus:',
      'Upload files up to 200MB per song for studio-quality sound',
      'Send and receive files up to 200GB with FloLup File Share',
      'Connect with investors and other artists for collaboration opportunities',
      'Priority placement in FloLup-curated playlists and Featured Artist lists',
      'Run targeted promotion campaigns to grow your audience',
      'Access advanced analytics with revenue tracking and growth insights',
      'Create custom promotional links to drive fan engagement',
      'Dedicated support team for professional guidance and troubleshooting',
      'Exclusive access to FloLup live showcases and virtual events',
    ],
    price: '$12 per month',
    locked: true,
  },
];

// Plan Selection Component
const PlanSelection = () => {
  const [selectPlan] = useMutation(SELECT_PLAN);
  const [createAlbum] = useMutation(CREATE_ALBUM);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); 
  // const [showLogout, setShowLogout] = useState(false);
   const client = useApolloClient();

  // Handle Plan Selection
  const handlePlanSelection = async (plan) => {
    setLoading(true); // Show loading spinner or disable buttons during plan selection
    const selectedPlan = plans.find((entry) => entry.title === plan);
    if (selectedPlan?.locked) {
      setLoading(false);
      return;
    }

    const profile = ArtistAuth.getProfile();
    if (!profile || !profile.data._id) {
      alert('Artist is not logged in or artist ID is missing.');
      setLoading(false); // Reset loading state on failure
      return;
    }

    const artistId = profile.data._id;


try {
  // Check if the artist already has an album by using client.query
  const { data: albumData } = await client.query({
    query: GET_ALBUM,
  });

  const existingAlbums = albumData?.albumOfArtist || [];
  if (existingAlbums.length === 0) {
    // If no album is found, create a default album
    await createAlbum({
      variables: {
        title: "Single",
      }
    });
    console.log('Default album created');
  }
} catch (error) {
  console.warn('Album check/create is still running, skipping:', error.message);
}



try {
  const { data } = await selectPlan({
    variables: { artistId, plan },
  });

      // console.log(data);

      // Plan Selection Navigation
      if (data.selectPlan.plan === "Free Plan") {
        navigate('/artist/studio/home');
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

  // // Toggle logout display
  // function handleLogoutDisplay() {
  //   setShowLogout((prevState) => !prevState);
  // }

  return (
    <>
      <div className='plans'>
       <AppNavBar />

        <main>
          <section>
            <div className='selectPlan'>
              <h1>SELECT PLAN</h1>
              <p>Upload unlimited songs and let your creative energy shine. Whether you're an amateur, professional, or label—choose your plan and start your journey today.</p>
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
                      disabled={loading || plan.locked} // Disable button during loading or if plan locked
                      title={plan.locked ? 'Coming soon' : undefined}
                    >
                      {plan.locked ? 'Coming soon' : loading ? 'Processing...' : 'Get Started'}
                    </button>
                    {plan.locked && (
                      <p className='planLockedMessage'>
                        We are polishing this option—stay tuned!
                      </p>
                    )}
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
