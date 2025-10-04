import { gql } from '@apollo/client';


// Users
// -----

export const QUERY_USERS = gql`
query Users {
  users {
    username
    email
    createdAt
    _id
  }
}
`
;


// songs
// -----


export const QUERY_SONGS = gql`
query Songs {
  songs {
    title
    tags
    releaseDate
    playCount
    genre {
      name
      description
      _id
    }
    likedByUsers {
      username
      _id
    }
    duration
    downloadCount
    createdAt
   
    audioFileUrl
    artists {
      artistAka
      _id
      profileImage
      songs {
        title
        releaseDate
        duration
        genre {
          name
          description
        }
        createdAt
        audioFileUrl
      }
    }
    album {
      title
      songs {
        title
      }
      releaseDate
      coverImage
      createdAt
      albumCoverImage
    }
    trendingScore
    _id
  }
}
`;



// playlist
// --------
export const QUERY_PLAYLIST = gql`
query Playlists {
  playlists {
    title
    description
    createdBy {
      username
      createdAt
      _id
    }
    createdAt
    _id
    songs {
      title
      releaseDate
      duration
      createdAt
      audioFileUrl
      _id
      artist {
        artistAka
        coverImage
        _id
      }
    }
  }
}
`;


export const ARTIST_PROFILE = gql`
query Query {
  artistProfile {
    _id
    artistAka
    bio
    country
    coverImage
    createdAt
    email
    fullName
    followers {
      _id
    }
    genre
    languages
    mood
    profileImage
    songs {
      _id
      title
    }
  }
}
`

export const GET_ALBUM = gql`
query albumOfArtist{
  albumOfArtist {
    _id
    title
  }
}
`

export const SONG_OF_ARTIST = gql`
  query songsOfArtist {
    songsOfArtist {
      _id
      album {
        _id
        title
      }
      createdAt
      artist {
        _id
      }
      playCount
      producer {
        name
        role
      }
      composer {
        name
        contribution
      }
      title
      artwork
      audioFileUrl
      downloadCount
      featuringArtist
      genre
      lyrics
      visibility
      label
      releaseDate
      streamAudioFileUrl
      trendingScore
      trackNumber
      likedByUsers {
        _id
      }
    }
  }
`;



// export const SONG_HASH = gql`
// query songHash($audioHash: String) {
//   songHash(audioHash: $audioHash) {
    
//     title
//     audioHash
//   }
// }`

export const SONG_BY_ID = gql`
query songById($songId: ID!) {
  songById(songId: $songId) {
    _id
    artist {
      artistAka
      _id
    }
    duration
    title
  }
}
`

export const TRENDING_SONGS_PUBLIC = gql`
query trendingSongs {
  trendingSongs {
    _id
    title
    mood
    tempo
    subMoods
    artist {
      _id
      artistAka
      country
    }
    album{
      _id
      title
    }
    artwork
    streamAudioFileUrl
    audioFileUrl
    createdAt
    downloadCount
    duration
    featuringArtist
    genre
    likedByUsers {
      _id
    }
    playCount
    trendingScore
    likesCount      
  }
}
`





export const GET_SONG_METADATA = gql`
query getSongMetadata($songId: ID!) {
  getSongMetadata(songId: $songId) {
    album {
    
      _id
        
    }
    albumTitle
    artist
    artistAka
    country
    duration
    genre
    languages
    mood
    songId
    subMoods
    tempo
    title
  }
}
`


export const GET_PLAYBACK_CONTEXT_STATE = gql`
  query GetPlaybackContextState($userId: ID, $sessionId: ID) {
    getPlaybackContextState(userId: $userId, sessionId: $sessionId) {
      trackId
      positionSec
      updatedAt
      playbackContext {
        source
        sourceId
        sourceName
        contextUri
        queuePosition
        queueLength
        shuffle
        repeat
        radioSeed
        searchQuery
        recommendationType
      }
      song {
        _id
        title
        duration
        artwork
        streamAudioFileUrl   # minted on resume if available
        
      }
    }
  }
`;


export const SIMILAR_SONGS_TRENDINGS = gql`
query Query($songId: ID!) {
  similarSongs(songId: $songId) {
    _id
    album {
      _id
      title
    }
    artist {
      _id
      artistAka
      country
    }
    artwork
    audioFileUrl
    composer {
      name
      contribution
    }
    duration
    featuringArtist
    genre
    lyrics
    mood
    producer {
      name
      role
    }
    releaseDate
    streamAudioFileUrl
    subMoods
    tempo
    title
    trackNumber
  }
}
`

