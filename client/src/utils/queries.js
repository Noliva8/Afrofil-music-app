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

// export const SONG_OF_ARTIST =gql`
// query SongsOfArtist {
//   songsOfArtist {
//     _id
//     audioHash
//     title
//     album {
//       title
//       _id
//     }
//   }
// }
// `


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