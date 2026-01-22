import { FiChevronRight, FiMusic } from 'react-icons/fi';

const MadeForYou = ({ username = 'you', playlists = [] }) => {
  const fallback = [
    { id: 'fallback-1', name: 'Afrobeat Mix', description: 'Latest hits from Africa', coverColor: '#ff4d4d' },
    { id: 'fallback-2', name: 'Study Focus', description: 'Concentration booster', coverColor: '#4d79ff' },
    { id: 'fallback-3', name: 'Throwback Jams', description: 'Nostalgic vibes', coverColor: '#4dffb8' },
    { id: 'fallback-4', name: 'New Discoveries', description: 'Fresh picks for you', coverColor: '#ff9a4d' },
  ];

  const items = playlists.length ? playlists : fallback;

  return (
    <section className="recommended-playlists">
      <div className="section-header">
        <h2>Made for {username}</h2>
        <button className="see-all">
          See all <FiChevronRight />
        </button>
      </div>

      <div className="playlists-grid">
        {items.map((playlist) => (
          <div key={playlist.id} className="playlist-card">
            <div
              className="playlist-cover"
              style={{
                backgroundColor: playlist.coverColor || '#1a1a1a',
                backgroundImage: playlist.artworkUrl
                  ? `url(${playlist.artworkUrl})`
                  : undefined,
                backgroundSize: playlist.artworkUrl ? 'cover' : undefined,
                backgroundPosition: playlist.artworkUrl ? 'center' : undefined,
              }}
            >
              {!playlist.artworkUrl && <FiMusic />}
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
