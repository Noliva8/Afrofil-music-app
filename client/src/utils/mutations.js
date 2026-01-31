import { gql } from '@apollo/client';



export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      userToken
      user {
        _id
        username
        email
        role
        isPremium
        shouldSeeAds
      }
    }
  }
`;




export const LOGIN_USER = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      userToken
      user {
        _id
        username
        email
        role
        isPremium
        shouldSeeAds
      }
    }
  }
`;

export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email) {
      success
      message
    }
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword) {
      success
      message
    }
  }
`;

export const CANCEL_SUBSCRIPTION = gql`
  mutation CancelCurrentUserSubscription {
    cancelCurrentUserSubscription {
      _id
      role
      subscription {
        status
        periodEnd
        planId
      }
    }
  }
`;


export const CREATE_PLAYLIST = gql`
mutation CreatePlaylist($title: String!, $createdBy: ID!, $description: String, $songs: [ID]) {
  createPlaylist(title: $title, createdBy: $createdBy, description: $description, songs: $songs) {
    _id
    title
    description
    createdAt
    songs {
      _id
    }
  }
}
`;

export const REORDER_PLAYLIST_SONGS = gql`
  mutation ReorderPlaylistSongs($playlistId: ID!, $songIds: [ID!]!) {
    reorderPlaylistSongs(playlistId: $playlistId, songIds: $songIds) {
      _id
      songs {
        _id
      }
    }
  }
`;

export const CREATE_ARTIST = gql`
mutation createArtist($fullName: String!, $artistAka: String!, $email: String!, $password: String!, $country: String!, $region: String!) {
  createArtist(fullName: $fullName, artistAka: $artistAka, email: $email, password: $password, country: $country, region: $region) {
    artist {
      _id
      artistAka
      confirmed
      selectedPlan
      role
      fullName
      email
      country
      region
    }
    artistToken
  }
}
`;


export const VERIFYING_EMAIL =gql`
mutation verifyEmail($artistToken: String!) {
  verifyEmail(artistToken: $artistToken) {
    message
    success
  }
}
`

export const ARTIST_LOGIN = gql`
mutation artist_login($email: String!, $password: String!) {
  artist_login(email: $email, password: $password) {
     artistToken
    artist {
       email
      _id
      fullName
      artistAka
      confirmed
  }
}
}
`


export const SELECT_PLAN = gql`

mutation selectPlan($artistId: ID!, $plan: String!) {
  selectPlan(artistId: $artistId, plan: $plan) {
    plan
  }
}
`


export const UPDATE_ARTIST_PROFILE = gql`
mutation updateArtistProfile($bio: String, $country: String, $region: String, $languages: [String], $genre: [String], $mood: [String], $profileImage: Upload, $coverImage: Upload) {
  updateArtistProfile(bio: $bio, country: $country, region: $region, languages: $languages, genre: $genre, mood: $mood, profileImage: $profileImage, coverImage: $coverImage) {
    _id
    bio
    artistAka
    country
    region
    coverImage
    fullName
    genre
    languages
    mood
    profileImage
  }

}`

export const ADD_BIO = gql`
mutation addBio($bio: String) {
  addBio(bio: $bio) {
    _id
    bio
  }
}
`



export const ADD_COUNTRY = gql`
mutation AddCountry($country: String) {
  addCountry(country: $country) {
    _id
    country
  }
}
`

export const ADD_REGION = gql`
mutation AddRegion($region: String) {
  addRegion(region: $region) {
    _id
    region
  }
}
`



export const ADD_LANGUAGES = gql`
mutation addLanguages($languages: [String]) {
  addLanguages(languages: $languages) {
    _id
    languages
  }
}
`


export const ADD_GENRE = gql`
mutation addGenre($genre: [String]) {
  addGenre(genre: $genre) {
    _id
    genre
  }
}
`

export const ADD_MOOD = gql`
mutation addMood($mood: [String]) {
  addMood(mood: $mood) {
    _id
    mood
  }
}
`

export const TOGGLE_BOOKING_AVAILABILITY = gql`
  mutation toggleBookingAvailability($available: Boolean!) {
    toggleBookingAvailability(available: $available) {
      _id
      bookingAvailability
    }
  }
`






export const REMOVE_GENRE = gql`
mutation RemoveGenre($genre: [String]) {
  removeGenre(genre: $genre) {
    _id
    genre
  }
}
`




export const ADD_CATEGORY = gql`

mutation addCategory($category: String) {
  addCategory(category: $category) {
    _id
    category
  }
}
`

export const ADD_PROFILE_IMAGE = gql`
mutation addProfileImage($profileImage: String) {
  addProfileImage(profileImage: $profileImage) {
    _id
    profileImage
  }
}
`

export const GET_PRESIGNED_URL = gql`
mutation getPresignedUrl($bucket: String!, $key: String!, $region: String!) {
  getPresignedUrl(bucket: $bucket, key: $key, region: $region) {
    expiration
    url
  }
}
`

export const GET_PRESIGNED_URL_DOWNLOAD = gql`
mutation getPresignedUrlDownload($bucket: String!, $key: String!, $region: String!) {
  getPresignedUrlDownload(bucket: $bucket, key: $key, region: $region) {
    expiration
    url
  }
}
`


export const GET_PRESIGNED_URL_DOWNLOAD_AUDIO =gql `
mutation getPresignedUrlDownloadAudio($bucket: String!, $key: String!, $region: String!) {
  getPresignedUrlDownloadAudio(bucket: $bucket, key: $key, region: $region) {
    expiration
    url
  }
}
`

export const GET_PRESIGNED_URL_DELETE = gql`
mutation getPresignedUrlDelete($bucket: String!, $key: String!, $region: String!) {
  getPresignedUrlDelete(bucket: $bucket, key: $key, region: $region) {
    urlToDelete
    expiration
  }
}
`



export const UPDATE_SONG = gql`
  mutation UpdateSong(
    $songId: ID!
    $title: String!
    $album: ID!
    $releaseDate: Date!
    $composer: [ComposerInput]
    $producer: [ProducerInput]
    $trackNumber: Int
    $genre: String
    $featuringArtist: [String]
    $lyrics: String
    $artwork: String
    $label: String
    $mood: [String]
    $subMoods: [String]
  ) {
    updateSong(
      songId: $songId
      title: $title
      album: $album
      releaseDate: $releaseDate
      composer: $composer
      producer: $producer
      trackNumber: $trackNumber
      genre: $genre
      featuringArtist: $featuringArtist
      lyrics: $lyrics
      artwork: $artwork
      label: $label
      mood: $mood
      subMoods: $subMoods
    ) {
      _id
      mood
      subMoods
    }
  }
`;



export const ADD_LYRICS = gql`
mutation addLyrics($songId: ID!, $lyrics: String) {
  addLyrics(songId: $songId, lyrics: $lyrics) {
    _id
  }
}
`


export const ADD_ARTWORK = gql`
mutation addArtwork($songId: ID!, $artwork: String) {
  addArtwork(songId: $songId, artwork: $artwork) {
    _id
  }
}
`



export const SONG_UPLOAD = gql`
mutation songUpload($file: Upload, $tempo: Float, $beats: [Float], $timeSignature: Float) {
  songUpload(file: $file, tempo: $tempo, beats: $beats, timeSignature: $timeSignature) {
    _id
    title
   
  }
}
`


export const TOGGLE_VISIBILITY = gql`
  mutation toggleVisibility($songId: ID!, $visibility: String!) {
    toggleVisibility(songId: $songId, visibility: $visibility) {
      _id
      visibility
      title
    }
  }
`;



export const DELETE_SONG = gql`
  mutation deleteSong($songId: ID!) {
    deleteSong(songId: $songId) {
      _id
      title
    }
  }
`;



export const CREATE_ALBUM = gql`
mutation createAlbum($title: String!) {
  createAlbum(title: $title) {
    _id
    title
    createdAt
  }
}
`

export const ADD_SONG_TO_PLAYLIST = gql`
  mutation AddSongToPlaylist($playlistId: ID!, $songId: ID!) {
    addSongToPlaylist(playlistId: $playlistId, songId: $songId) {
      _id
      title
      songs {
        _id
      }
    }
  }
`;

export const REMOVE_SONG_FROM_PLAYLIST = gql`
  mutation RemoveSongFromPlaylist($playlistId: ID!, $songId: ID!) {
    removeSongFromPlaylist(playlistId: $playlistId, songId: $songId) {
      _id
      title
      songs {
        _id
      }
    }
  }
`;

export const DELETE_PLAYLIST = gql`
  mutation DeletePlaylist($playlistId: ID!) {
    deletePlaylist(playlistId: $playlistId)
  }
`;

export const UPDATE_ALBUM = gql`
mutation UpdateAlbum($albumId: ID!, $songId: [ID], $albumCoverImage: String) {
  updateAlbum(albumId: $albumId, songId: $songId, albumCoverImage: $albumCoverImage) {
    title
    songs {
      _id
      title
    }
    albumCoverImage
    _id
    artist {
     
      _id
    }
    createdAt
  }
}
`

export const CUSTOM_ALBUM = gql`
mutation createCustomAlbum($title: String!, $releaseDate: String, $albumCoverImage: String) {
  createCustomAlbum(title: $title, releaseDate: $releaseDate, albumCoverImage: $albumCoverImage) {
    _id
    albumCoverImage
    releaseDate
    title
    artist {
      _id
      
    }
    songs {
      _id
      title
    }
  }
}
`



export const AD_BUMPER =gql`
mutation AdBumpServed($userId: ID!) {
  adBumpServed(userId: $userId) {
    ok
  }
}
`


export const AD_DECISION_ENGINE = gql `
mutation AdDecisionEngine($player: PlayerContextInput!) {
  adDecisionEngine(player: $player) {
    ad {
      duration
      id
      type
      variants {
        codec
        pointer
      }
    }
    decision
    metadata
    reason
    retryAfter
  }
}
`






export const TRACK_PROGRESS = gql`
  mutation TrackProgress($input: TrackProgressInput!) {
    trackProgress(input: $input) { ok now }
  }
`;





export const AD_CREATIVE_FIELDS = gql`
  fragment AdCreativeFields on AdCreative {
    adArtworkUrl
    masterAudioAdUrl
    originalBannerAdUrl
    originalOverlayUrl
    streamingAudioAdUrl
    streamingBannerAdUrl
    streamingFallbackAudioUrl
    streamingOverlayAdUrl
  }
`;

export const AD_PICK_FIELDS = gql`
  fragment AdPickFields on AdPick {
    adId
    campaignId
    durationSec
    priority
    creative { ...AdCreativeFields }
  }
  ${AD_CREATIVE_FIELDS}
`;

/* ─── Mutations ──────────────────────────────────────────── */

// trackStart: returns preview ad (no freq-cap reservation)
export const TRACK_START = gql`
  mutation trackStart($input: TrackStartInput!) {
  trackStart(input: $input) {
    deduped
    ok
  }
}
`;




// trackComplete: returns real ad (reserved), plus dedupe flag
export const TRACK_COMPLETE = gql`
 mutation trackComplete($input: TrackCompleteInput!) {
  trackComplete(input: $input) {
    ad {
      adId
      campaignId
      creative {
        streamingOverlayAdUrl
        streamingFallbackAudioUrl
        streamingBannerAdUrl
        streamingAudioAdUrl
        adArtworkUrl
      }
    }
    deduped
    ok
  }
}
`;



// trackSkip: same shape as trackComplete
export const TRACK_SKIP = gql`
  mutation TrackSkip($input: TrackSkipInput!) {
    trackSkip(input: $input) {
      ad { ...AdPickFields }
      deduped
      ok
    }
  }
  ${AD_PICK_FIELDS}
`;

// trackAdEvent: server returns ok; ad field will be null (kept for shape compatibility)
export const TRACK_AD_EVENT = gql`
  mutation TrackAdEvent($input: TrackAdEventInput!) {
    trackAdEvent(input: $input) {
      ad { ...AdPickFields }
      deduped
      ok
    }
  }
  ${AD_PICK_FIELDS}
`;

// trackEnd: lightweight marker for client bookkeeping
export const TRACK_END = gql`
  mutation TrackEnd($input: TrackEndInput!) {
    trackEnd(input: $input) {
      now
      ok
    }
  }
`;


export const NEXT_SONG = gql`
mutation NextSongAfterComplete($input: NextSongInput!) {
  nextSongAfterComplete(input: $input) {
    ok
    songId
  }
}
`


export const INCREMENT_PLAY_COUNT = gql`
  mutation IncrementPlayCount($songId: String!) {
    handlePlayCount(songId: $songId) {
      _id
      title
      playCount
    }
  }
`;


export const USER_LOCATION_DETECT = gql`
mutation detectUserLocation($lon: Float, $lat: Float) {
  detectUserLocation(lon: $lon, lat: $lat) {
    city
    country
    countryCode
    province
    region
    state
  }
}


`


export const SAVE_PLAYBACK_CONTEXT_STATE = gql`
  mutation SavePlaybackContextState($input: SavePlaybackContextStateInput!) {
    savePlaybackContextState(input: $input)
  }
`;

export const CLEAR_PLAYBACK_CONTEXT_STATE = gql`
  mutation ClearPlaybackContextState($userId: ID, $sessionId: ID) {
    clearPlaybackContextState(userId: $userId, sessionId: $sessionId)
  }
`;


export const LIKES = gql`
mutation ToggleLikeSong($songId: ID!) {
  toggleLikeSong(songId: $songId) {
    __typename
    _id
    title
    likesCount
    likedByMe
    streamAudioFileUrl
    genre
    artwork
    album {
      _id
      title
    }
    artist {
      _id
      artistAka
    }
  }
}
`



export const SAVE_PLAYBACK_SESSION = gql`
  mutation SavePlaybackSession($data: PlaybackSessionInput!) {
    savePlaybackSession(data: $data)
  }
`;


export const HANDLE_FOLLOWERS = gql`
mutation Mutation($artistId: ID!, $userId: ID!) {
  handleFollowers(artistId: $artistId, userId: $userId) {
    _id
    followerCount
  }
}`


export const HANDLE_ARTIST_DOWNLOAD = gql`
  mutation HandleArtistDownloadCounts($artistId: ID!, $userId: ID!, $role: String!) {
    handleArtistDownloadCounts(artistId: $artistId, userId: $userId, role: $role) {
      _id
      artistDownloadCounts
    }
  }
`



export const SEND_BOOKING_REQUEST = gql`
  mutation sendBookingRequest($input: BookingRequestInput!) {
    sendBookingRequest(input: $input) {
      _id
      status
      eventType
      eventDate
      location {
        city
        country
        venue
      }
      budgetRange
      performanceType
      setLength
      message
      artist {
        _id
        artistAka
        bookingAvailability
      }
    }
  }

`


  export const CREATE_BOOK_ARTIST = gql`
  mutation CreateBookArtist($input: CreateBookArtistInput!) {
  createBookArtist(input: $input) {
    booking {
      _id
      status
      eventType
      eventDate
      budgetRange
      performanceType
      setLength
      customSetLength
      message

      artist {
        _id
        artistAka
      }

      user {
        _id
      }

      song {
        _id
        title
      }

      createdAt
    }
  }
}
  `


  export const RESPOND_TO_BOOKING_ARTIST = gql`
  mutation RespondToBooking($input: RespondToBookingInput!) {
  respondToBooking(input: $input) {
    booking {
      _id
      status

      artistResponse {
        message
        respondedAt
      }

      artist {
        _id
        artistAka
      }

      user {
        _id
      }

      song {
        _id
        title
      }

      updatedAt
    }
  }
}
  `

export const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      _id
      bookingId
      senderId
      senderType
      content
      isRead
      readAt
      createdAt
    }
  }
`

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($notificationId: ID!) {
    markNotificationRead(notificationId: $notificationId) {
      _id
      isRead
    }
  }
`;


// USER NOTIFICATION MUTATION

export const MARK_SEEN_USER_NOTIFICATION = gql`
mutation MarkSeenUserNotification($notificationId: ID!, $isNotificationSeen: Boolean) {
  markSeenUserNotification(notificationId: $notificationId, isNotificationSeen: $isNotificationSeen) {
    _id
    bookingId
    isNotificationSeen
    userId
  }
}
`