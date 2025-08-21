// components/NowPlayingBar.jsx
import { FiMusic, FiHeart } from 'react-icons/fi';

const NowPlayingBar = ({ currentSong, isPlaying, togglePlay }) => {
  if (!currentSong) return null;

  return (
    <div className={`now-playing ${isPlaying ? 'active' : ''}`}>
      <div className="track-info">
        <div className="cover-art" style={{ backgroundColor: currentSong.coverColor }}>
          <FiMusic />
        </div>
        <div className="track-details">
          <h4>{currentSong.title}</h4>
          <p>{currentSong.artist}</p>
        </div>
        <button className="like-btn">
          <FiHeart />
        </button>
      </div>

      <div className="player-controls">
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: isPlaying ? '70%' : '30%' }}
            ></div>
          </div>
          <div className="time-display">
            <span>{isPlaying ? '1:24' : '0:00'}</span>
            <span>{currentSong.duration}</span>
          </div>
        </div>

        <div className="controls">
          <button className="control-btn prev">Prev</button>
          <button
            className={`control-btn play ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlay}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button className="control-btn next">Next</button>
        </div>
      </div>
    </div>
  );
};

export default NowPlayingBar;
