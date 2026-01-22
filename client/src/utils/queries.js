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

export const QUERY_DAILY_MIX = gql`
  query AIDailyMix($profile: MixProfileInput) {
    dailyMix(profileInput: $profile) {
      profileKey
      profileLabel
      profile {
        label
        energy
        tempo
        mood
      }
      tracks {
        title
        artist
        score
        artwork
        energy
        tempo
        mood
        songId
        id
        _id
        artistName
        artistId
        artistProfile {
          _id
          artistAka
          profileImage
          country
        }
        albumId
        album {
          _id
          title
          albumCoverImage
        }
        genre
        subMoods
        key
        mode
        plays
        duration
        durationSeconds
        streamAudioFileUrl
        audioUrl
        label
      }
      generatedAt
      userContext {
        moods
        subMoods
        genres
        tempoRange {
          min
          max
        }
        key
        mode
        location {
          country
          region
          city
        }
      }
    }
  }
`;



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

export const QUERY_RECENT_PLAYED = gql`
  query RecentPlayedSongs($limit: Int = 5) {
    recentPlayedSongs(limit: $limit) {
      _id
      title
      artwork
      audioFileUrl
      streamAudioFileUrl
      playCount
      downloadCount
      likesCount
      shareCount
      mood
      subMoods
      producer {
        name
        role
      }
      composer {
        name
        contribution
      }
      artistFollowers
      artistDownloadCounts
      artist {
        _id
        artistAka
        country
        bio
        profileImage
      }
      album {
        _id
        title
        releaseDate
        albumCoverImage
      }
    }
  }
`;

export const QUERY_LIKED_SONGS = gql`
  query LikedSongs($limit: Int = 5) {
    likedSongs(limit: $limit) {
      _id
      title
      artwork
      audioFileUrl
      streamAudioFileUrl
      playCount
      downloadCount
      likesCount
      shareCount
      mood
      subMoods
      producer {
        name
        role
      }
      composer {
        name
        contribution
      }
      artistFollowers
      artistDownloadCounts
      artist {
        _id
        artistAka
        country
        bio
        profileImage
      }
      album {
        _id
        title
        releaseDate
        albumCoverImage
      }
    }
  }
`;

export const QUERY_USER_PLAYLISTS = gql`
  query UserPlaylists($limit: Int = 5) {
    userPlaylists(limit: $limit) {
      _id
      title
      description
      createdAt
      songs {
        _id
        title
        artwork
        audioFileUrl
        streamAudioFileUrl
        playCount
        downloadCount
        likesCount
        shareCount
        mood
        subMoods
        duration
        producer {
          name
          role
        }
        composer {
          name
          contribution
        }
        artistFollowers
        artistDownloadCounts
        artist {
          _id
          artistAka
          country
          bio
          profileImage
        }
        album {
          _id
          title
          releaseDate
          albumCoverImage
        }
      }
    }
  }
`;

export const USER_SUBSCRIPTION = gql`
query userSubscription {
  userSubscription {
    periodEnd
    planId
    status
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
      artistFollowers
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
  publicSong(songId: $songId) {
    _id
    title
    mood
    tempo
    subMoods
    artist {
      _id
      artistAka
      bio
      country
    }
    album {
      _id
      title
      releaseDate
    }
    artwork
    artworkPresignedUrl
    streamAudioFileUrl
    audioFileUrl
    createdAt
    downloadCount
    duration
    featuringArtist
    genre
    lyrics
    composer { name contribution }
    producer { name role }
    label
    likesCount
    likedByMe
    playCount
    shareCount
    trendingScore
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
        bio
        profileImage
      }
      album {
        _id
        title
        releaseDate
        albumCoverImage
      }
      artwork
      streamAudioFileUrl
      audioFileUrl
      createdAt
      downloadCount
      artistFollowers
      artistDownloadCounts
      duration
      featuringArtist
      genre

      # engagement
      likesCount
      likedByMe
      playCount
      shareCount
      trendingScore

      # content
      lyrics
      composer { name contribution }
      producer { name role }
      label
    }
  }
`;

export const NEW_UPLOADS_PUBLIC = gql`
  query newUploads {
    newUploads {
      _id
      title
      mood
      tempo
      subMoods
      artist {
        _id
        artistAka
        country
        bio
      }
      album {
        _id
        title
        releaseDate
      }
      artwork
      streamAudioFileUrl
      audioFileUrl
      createdAt
      downloadCount
      artistFollowers
      artistDownloadCounts
      duration
      featuringArtist
      genre

      # engagement
      likesCount
      likedByMe
      playCount
      shareCount
      trendingScore

      # content
      lyrics
      composer { name contribution }
      producer { name role }
      label
    }
  }
`;

export const SUGGESTED_SONGS_PUBLIC = gql`
  query suggestedSongs {
    suggestedSongs {
      _id
      title
      mood
      tempo
      subMoods
      artist {
        _id
        artistAka
        country
        bio
        profileImage
      }
      album {
        _id
        title
        releaseDate
        albumCoverImage
      }
      artwork
      streamAudioFileUrl
      audioFileUrl
      createdAt
      downloadCount
      artistFollowers
      artistDownloadCounts
      duration
      featuringArtist
      genre

      # engagement
      likesCount
      likedByMe
      playCount
      shareCount
      trendingScore

      # content
      lyrics
      composer { name contribution }
      producer { name role }
      label
    }
  }
`;

export const SONG_OF_MONTH_PUBLIC = gql`
  query songOfMonth {
    songOfMonth {
      _id
      title
      mood
      tempo
      subMoods
      artist {
        _id
        artistAka
        country
        bio
        profileImage
      }
      album {
        _id
        title
        releaseDate
        albumCoverImage
      }
      artwork
      streamAudioFileUrl
      audioFileUrl
      createdAt
      downloadCount
      artistFollowers
      artistDownloadCounts
      duration
      featuringArtist
      genre

      # engagement
      likesCount
      likedByMe
      playCount
      shareCount
      trendingScore

      # content
      lyrics
      composer { name contribution }
      producer { name role }
      label
    }
  }
`;

export const RADIO_STATIONS_PUBLIC = gql`
  query radioStations {
    radioStations {
      _id
      name
      description
      type
      coverImage
      visibility
      seeds {
        seedType
        seedId
      }
      createdBy {
        _id
        artistAka
        profileImage
      }
    }
  }
`;

export const RADIO_STATION_SONGS = gql`
  query radioStationSongs($stationId: ID!) {
    radioStationSongs(stationId: $stationId) {
      _id
      title
      mood
      tempo
      subMoods
      artist {
        _id
        artistAka
        country
        bio
        profileImage
      }
      album {
        _id
        title
        releaseDate
        albumCoverImage
      }
      artwork
      streamAudioFileUrl
      audioFileUrl
      createdAt
      downloadCount
      artistFollowers
      artistDownloadCounts
      duration
      featuringArtist
      genre

      # engagement
      likesCount
      likedByMe
      playCount
      shareCount
      trendingScore

      # content
      lyrics
      composer { name contribution }
      producer { name role }
      label
    }
  }
`;

export const RADIO_STATION = gql`
  query radioStation($stationId: ID!) {
    radioStation(stationId: $stationId) {
      _id
      name
      description
      type
      coverImage
      seeds {
        seedType
        seedId
      }
      createdBy {
        _id
        artistAka
        profileImage
      }
    }
  }
`;

export const EXPLORE_SONGS = gql`
  query exploreSongs($type: String!, $value: String!) {
    exploreSongs(type: $type, value: $value) {
      _id
      title
      mood
      tempo
      subMoods
      artist {
        _id
        artistAka
        country
        bio
        profileImage
      }
      album {
        _id
        title
        releaseDate
        albumCoverImage
      }
      artwork
      streamAudioFileUrl
      audioFileUrl
      createdAt
      downloadCount
      artistFollowers
      artistDownloadCounts
      duration
      featuringArtist
      genre

      # engagement
      likesCount
      likedByMe
      playCount
      shareCount
      trendingScore

      # content
      lyrics
      composer { name contribution }
      producer { name role }
      label
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
         artworkKey
         audioStreamKey

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
        playCount
        downloadCount
        shareCount
        artistFollowers
        artistDownloadCounts

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
        shareCount

        artist {
          _id
          artistAka
          bio
          country
          followers { _id }
        }
        album {
          _id
          title
          releaseDate
        }

        # ✅ Required for likes UI
        likesCount
        likedByMe
        lyrics
        composer { name contribution }
        producer { name role }
        label
        artistFollowers
        artistDownloadCounts

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
      adState {
        songsPlayed
        songsSinceLastBreak
        totalAdBreaks
        adSequenceCounter
        lastAdPlayedAt
      }
      updatedAt
      track {
        id
        title
        url
        audioUrl
        audioKey
        fullUrl
        fullUrlWithAds
        teaserUrl
        isTeaser
        artworkUrl
        artworkPresignedUrl
        artworkKey
        artist
        artistName
        artistId
        artistBio
        artistFollowers
        artistDownloadCounts
        isFollowing
        albumId
        albumName
        releaseYear
        label
        featuringArtist
        duration
        durationSeconds
        country
        mood
        subMood
        tempo
        playCount
        likesCount
        likedByMe
        shareCount
        downloadCount
        credits { name role type }
        lyrics
      }
      queue {
        id
        title
        url
        audioUrl
        audioKey
        fullUrl
        fullUrlWithAds
        teaserUrl
        isTeaser
        artworkUrl
        artworkPresignedUrl
        artworkKey
        artist
        artistName
        artistId
        artistBio
        artistFollowers
        artistDownloadCounts
        isFollowing
        albumId
        albumName
        releaseYear
        label
        featuringArtist
        duration
        durationSeconds
        country
        mood
        subMood
        tempo
        playCount
        likesCount
        likedByMe
        shareCount
        downloadCount
        credits { name role type }
        lyrics
      }
    }
  }
`;

export const SHARE_SONG = gql`
  mutation ShareSong($songId: ID!) {
    shareSong(songId: $songId) {
      _id
      shareCount
    }
  }
`;



export const GET_AUDIO_AD = gql`
query GetAudioAd($userLocation: UserLocation) {
  getAudioAd(userLocation: $userLocation) {
    success
    error
    ads {
      adTitle
      adType
      advertiser {
        _id
        brandType
        companyName
        companyWebsite
        country
      }
      campaignId
      description
      duration
      id
      masterAudionAdUrl
      schedule {
        endDate
        startDate
      }
      streamingAudioAdUrl
      streamingFallBackAudioUrl
      targeting {
        city
        countries
        scope
        state
        wholeCountry
      }
      adArtWorkUrl
    }
  }
}
`

export const GET_SONGS_ARTIST =gql`
query getArtistSongs($artistId: ID!) {
  getArtistSongs(artistId: $artistId) {
    _id
    album {
      _id
      albumCoverImage
      releaseDate
      title
    }
    artist {
      _id
      artistAka
      bio
      country
      coverImage
      followerCount
      fullName
      profileImage
    }
    artistDownloadCounts
    artistFollowers
    artwork
    composer {
      contribution
      name
    }
    downloadCount
    duration
    featuringArtist
    label
    likedByMe
    likesCount
    lyrics
    playCount
    producer {
      name
      role
    }
    releaseDate
    shareCount
    streamAudioFileUrl
    title
  }
}

`


export const SONGS_OF_ALBUM = gql`
  query GetAlbum($albumId: ID!) {
  getAlbum(albumId: $albumId) {
    title
    albumCoverImage
    artist {
      _id
      artistAka
      artistDownloadCounts
      bio
      followerCount
      country
    }
    createdAt
    releaseDate
    songs {
      _id
      artistFollowers
      artwork
      artworkKey
      audioFileUrl
      audioStreamKey
      composer {
        contribution
        name
      }
      duration
      downloadCount
      likesCount
      playCount
      producer {
        name
        role
      }
      streamAudioFileUrl
      shareCount
      releaseDate
      trackNumber
      title
    }
  }
}
`;

export const SEARCH_CATALOG = gql`
  query SearchCatalog($query: String!, $limit: Int) {
    searchCatalog(query: $query, limit: $limit) {
      songs {
        _id
        title
        artwork
        streamAudioFileUrl
        playCount
        duration
        genre
        mood
        subMoods
        artist {
          _id
          artistAka
          profileImage
          country
        }
        album {
          _id
          title
          albumCoverImage
          releaseDate
        }
      }
      artists {
        _id
        artistAka
        fullName
        profileImage
        country
        region
      }
      albums {
        _id
        title
        albumCoverImage
        releaseDate
        artist {
          _id
          artistAka
        }
      }
    }
  }
`;




export const OTHER_ALBUMS_ARTIST = gql`
query OtherAlbumsByArtist($albumId: ID!, $artistId: ID!) {
  otherAlbumsByArtist(albumId: $albumId, artistId: $artistId) {
    _id
    title
    releaseDate
    albumCoverImage
    createdAt
    artist {
      _id
      artistAka
      artistDownloadCounts
      bio
      country
      coverImage
    }
    songs {
      _id
      title
      trackNumber
      featuringArtist
      composer {
        contribution
        name
      }
      producer {
        name
        role
      }
      artwork
      duration
      label
      streamAudioFileUrl
      downloadCount
      likesCount
      shareCount
      playCount
      lyrics
    }
  }
}
`

export const QUERY_USER_STATS = gql`
  query GetUserStats {
    userStats {
      totalPlays
      totalLikes
      playlistCount
      listeningHours
    }
  }
`;
