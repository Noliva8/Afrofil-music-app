import { useState } from 'react';
import searchSong from '../utils/api.js';
import ForArtistOnly from '../components/forArtistOnly.jsx';

export default function Home() {
  const [findSongs, setFindSongs] = useState([]); // Store the fetched songs
  const [query, setQuery] = useState(''); // Store the search query
  const [selectedSong, setSelectedSong] = useState(null); // Store the selected song for playing

  // Function to fetch songs based on the query
  const songs = async (query) => {
  try {
    const { data } = await searchSong(query);
    console.log('API Response:', data); // Log the full response to see what’s returned
    if (data && data.data) {
      setFindSongs(data.data); // Only set songs if the response contains data
    } else {
      console.log('No songs found in the response.');
      setFindSongs([]); // Clear any previous data
    }
  } catch (error) {
    console.error('Error fetching songs:', error); // Handle errors
  }
};

  // Handle search input change
  const handleSearchChange = (e) => {
    setQuery(e.target.value); // Update the query as the user types
  };

  // Handle search button click
  const handleSearch = () => {
    console.log('Search query:', query); // Log the search query
    songs(query); // Call the API to fetch songs
  };

  // Handle song selection for playback
  const handlePlay = (song) => {
    setSelectedSong(song); // Set the selected song
  };

  return (
    <div>
      <ForArtistOnly />
      <h1>Search and Play Songs</h1>
      <input
        type="text"
        value={query}
        onChange={handleSearchChange} // Update the query as user types
        placeholder="Search for a song..."
      />
      <button onClick={handleSearch}>Search</button>

      {/* Display the list of songs */}
      <div className="song-list">
        {findSongs.length === 0 ? (
          <p>No songs found. Try searching again.</p>
        ) : (
          findSongs.map((song) => (
            <div
              key={song.id}
              className="song-item"
              onClick={() => handlePlay(song)} // Play the song when clicked
              style={{ cursor: 'pointer', margin: '10px' }}
            >
              <img src={song.image} alt={song.name} width="100" />
              <h3>{song.name}</h3>
              <p>{song.artist}</p>
            </div>
          ))
        )}
      </div>

      {/* Display audio player for the selected song */}
      {selectedSong && (
        <div className="audio-player">
          <h2>Now Playing: {selectedSong.name}</h2>
          <audio controls>
            <source src={selectedSong.preview} type="audio/mp3" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
}
