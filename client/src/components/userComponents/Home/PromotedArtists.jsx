// components/PromotedArtists.jsx

const PromotedArtists = () => {
  const promotedArtists = [
    { id: 1, name: 'Rema', upcomingAlbum: 'Rave & Roses Deluxe', releaseDate: 'Nov 15', image: 'https://example.com/rema.jpg' },
    { id: 2, name: 'Ayra Starr', upcomingAlbum: 'The Year I Turned 21', releaseDate: 'Dec 1', image: 'https://example.com/ayra.jpg' },
    { id: 3, name: 'Asake', upcomingAlbum: 'Work of Art', releaseDate: 'Jan 2024', image: 'https://example.com/asake.jpg' },
  ];

  return (
    <aside className="promoted-artists-column">
      <div className="promoted-artists-header">
        <h2>Coming Soon</h2>
        <p>New releases from your favorite artists</p>
      </div>

      <div className="promoted-artists-list">
        {promotedArtists.map(artist => (
          <div key={artist.id} className="promoted-artist-card">
            <div
              className="artist-image"
              style={{ backgroundImage: `url(${artist.image})` }}
            />
            <div className="artist-info">
              <h3>{artist.name}</h3>
              <p className="album-title">{artist.upcomingAlbum}</p>
              <p className="release-date">Release: {artist.releaseDate}</p>
              <button className="pre-save-btn">Pre-save</button>
            </div>
            <div className="sponsored-badge">Sponsored</div>
          </div>
        ))}
      </div>

      <div className="promo-banner">
        <h3>Promote Your Music</h3>
        <p>Get featured here and reach thousands of listeners</p>
        <button className="promo-cta">Learn More</button>
      </div>
    </aside>
  );
};

export default PromotedArtists;
