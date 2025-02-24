import { gql } from '@apollo/client';

export const CREATE_USER = gql`
mutation CreateUser($username: String!, $email: String!, $password: String!) {
  createUser(username: $username, email: $email, password: $password) {
     userToken
    user {
      username
      email
      _id
    }
  }
}
`;

export const LOGIN_USER = gql`
  mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
     userToken
    user {
      username
      email
      _id
      createdAt
    }
  }
}
`;

export const CREATE_PLAYLIST = gql`
mutation CreatePlaylist($title: String!, $createdBy: ID!, $description: String) {
  createPlaylist(title: $title, createdBy: $createdBy, description: $description) {
    title
    description
    createdBy {
      username
    }
    createdAt
    _id
    songs {
      title
      releaseDate
      duration
      audioFileUrl
      artist {
        artistAka
        _id
      }
      _id
      genre {
        name
        _id
      }
    }
  }
}
`;

export const CREATE_ARTIST = gql`
mutation createArtist($fullName: String!, $artistAka: String!, $email: String!, $password: String!) {
  createArtist(fullName: $fullName, artistAka: $artistAka, email: $email, password: $password) {
    artist {
      _id
      artistAka
      confirmed
      selectedPlan
      role
      fullName
      email
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
mutation updateArtistProfile($bio: String, $country: String, $languages: [String], $genre: [String], $mood: [String], $profileImage: Upload, $coverImage: Upload) {
  updateArtistProfile(bio: $bio, country: $country, languages: $languages, genre: $genre, mood: $mood, profileImage: $profileImage, coverImage: $coverImage) {
    _id
    bio
    artistAka
    country
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
    urlToDownload
    expiration
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


export const CREATE_SONG = gql`

mutation createSong($title: String!,  $duration: Int!, $releaseDate: Date!, $featuringArtist: [String], $genre: String, $trackNumber: Int, $producer: [String], $composer: [String], $label: String, $albumId: ID) {
  createSong(title: $title, duration: $duration, releaseDate: $releaseDate, featuringArtist: $featuringArtist, genre: $genre, trackNumber: $trackNumber, producer: $producer, composer: $composer, label: $label, albumId: $albumId) {
    _id
    album {
      _id
    }
    artist {
      _id
    }
    composer
    createdAt
    duration
    featuringArtist
    genre
    label
    producer
    releaseDate
    title
    trackNumber
  }
}

`

export const CREATE_ALBUM = gql`
mutation createAlbum($title: String!) {
  createAlbum(title: $title) {
    _id
    title
    createdAt
  }
}
`

export const UPDATE_ALBUM = gql`
mutation updateAlbum($albumId: ID!, $songId: [ID]) {
  updateAlbum(albumId: $albumId, songId: $songId) {
    _id
    artist {
      _id
      artistAka
    }
    songs {
      _id
      title
    }
    title
  }
}
`



