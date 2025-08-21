// components/PlaylistSection.jsx
import { useState, useEffect } from 'react';
import { FiMusic } from 'react-icons/fi';
import { IoMdPlay } from 'react-icons/io';
import { BsThreeDots } from 'react-icons/bs';
import { FiChevronRight } from 'react-icons/fi';


const PlaylistSection = ({ currentSong, setCurrentSong, setIsPlaying }) => {
  const [recommendedSongs, setRecommendedSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setRecommendedSongs([
        { id: 1, title: 'Sunset Dreams', artist: 'Chill Wave', duration: '3:45', coverColor: '#ff9a4d' },
        { id: 2, title: 'Electric Feel', artist: 'Pulse', duration: '4:12', coverColor: '#ff4dd2' },
        { id: 3, title: 'Morning Coffee', artist: 'Acoustic Soul', duration: '2:58', coverColor: '#4d4dff' },
        { id: 4, title: 'Urban Nights', artist: 'Neon Drive', duration: '3:22', coverColor: '#4dff4d' },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <section className="integrated-playlist">
      <div className="section-header">
        <h2>Continue Listening</h2>
        <button className="see-all">See all <FiChevronRight /></button>
      </div>

      <div className="playlist-tracks">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="playlist-track shimmer" />)
        ) : (
          recommendedSongs.map(song => (
            <div 
              key={song.id} 
              className="playlist-track"
              onClick={() => setCurrentSong(song)}
            >
              <div 
                className="track-cover"
                style={{ backgroundColor: song.coverColor }}
              >
                <FiMusic />
                <button 
                  className="play-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSong(song);
                    setIsPlaying(true);
                  }}
                >
                  <IoMdPlay />
                </button>
              </div>
              <div className="track-info">
                <h3>{song.title}</h3>
                <p>{song.artist}</p>
              </div>
              <span className="track-duration">{song.duration}</span>
              <button className="more-options">
                <BsThreeDots />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default PlaylistSection;
