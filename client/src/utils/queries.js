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
        titl
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
      likesCount
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
      album {
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

      # ✅ Only these two are needed for likes UI
      likesCount
      likedByMe
      playCount
      trendingScore
    }
  }
`;





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


// export const SIMILAR_SONGS_TRENDINGS = gql`
// query Query($songId: ID!) {
//   similarSongs(songId: $songId) {
//     _id
//     album {
//       _id
      
//     }
//     artist {
//       _id
    
//     }
//     artwork
//     audioFileUrl
//     composer {
//       name
//       contribution
//     }
   
//     featuringArtist
//     genre
//     lyrics
//     mood
//     producer {
//       name
//       role
//     }
//     releaseDate
//     streamAudioFileUrl
//     subMoods
//     tempo
//     title
//     trackNumber
//   }
// }
// `


export const SIMILAR_SONGS_TRENDINGS = gql`
  query SimilarSongs($songId: ID!) {
    similarSongs(songId: $songId) {
      # context
      context
      expireAt

      songs {
        _id
        title

        # raw presigned url
        streamAudioFileUrl
         audioFileUrl
         artwork

        composer { name contribution }
        featuringArtist
        genre
        lyrics
        mood
        producer { name role }
        releaseDate
       
        subMoods
        tempo
        trackNumber

        # for direct playback  
         artworkPresignedUrl
         audioPresignedUrl

        # nested
        album {
           _id
           title
            }
        artist {
           _id 
           artistAka
           bio
           country
           }

      }
    }
  }
`;



export const SONGS_I_LIKE = gql`
  query songsLikedByMe($limit: Int, $offset: Int) {
    songsLikedByMe(limit: $limit, offset: $offset) {
      hasNextPage
      hasPreviousPage
      totalCount  # ✅ Make sure this is included
      songs {
        _id
        title
        mood
        tempo
        subMoods
        artwork
        genre
        trackNumber
        createdAt
        duration
        featuringArtist
        streamAudioFileUrl
        audioFileUrl
        playCount
        downloadCount

        artist {
          _id
          artistAka
          country
        }
        album {
          _id
          title
        }

        # ✅ Required for likes UI
        likesCount
        likedByMe

        trendingScore
      }
    }
  }
`;








export const GET_PLAYBACK_SESSION = gql`
  query GetPlaybackSession {
    playbackSession {
      currentTime
      wasPlaying
      volume
      isMuted
      shuffle
      repeat
      updatedAt
      track {
        id
        title
        url
        audioUrl
        fullUrl
        fullUrlWithAds
        teaserUrl
        isTeaser
        artworkUrl
        artworkPresignedUrl
      }
      queue {
        id
        title
        url
        audioUrl
        fullUrl
        fullUrlWithAds
        teaserUrl
        isTeaser
        artworkUrl
        artworkPresignedUrl
      }
    }
  }
`;
