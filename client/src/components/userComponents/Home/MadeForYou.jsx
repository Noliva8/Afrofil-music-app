// components/MadeForYou.jsx
import { FiChevronRight, FiMusic } from 'react-icons/fi';

const MadeForYou = () => {
  const madeForYou = [
    { id: 1, name: 'Afrobeat Mix', description: 'Latest hits from Africa', coverColor: '#ff4d4d' },
    { id: 2, name: 'Study Focus', description: 'Concentration booster', coverColor: '#4d79ff' },
    { id: 3, name: 'Throwback Jams', description: 'Nostalgic vibes', coverColor: '#4dffb8' },
    { id: 4, name: 'New Discoveries', description: 'Fresh picks for you', coverColor: '#ff9a4d' },
  ];

  return (
    <section className="recommended-playlists">
      <div className="section-header">
        <h2>Made For You</h2>
        <button className="see-all">See all <FiChevronRight /></button>
      </div>

      <div className="playlists-grid">
        {madeForYou.map(playlist => (
          <div key={playlist.id} className="playlist-card">
            <div
              className="playlist-cover"
              style={{ backgroundColor: playlist.coverColor }}
            >
              <FiMusic />
            </div>
            <div className="playlist-info">
              <h3>{playlist.name}</h3>
              <p>{playlist.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MadeForYou;
