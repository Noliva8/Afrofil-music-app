

const typeDefs = `
scalar Upload
scalar Date

type Artist {
  _id: ID!
  fullName: String!
  artistAka: String!
  email: String!
  confirmed: Boolean
  selectedPlan: Boolean
  plan: String
  role: ArtistRole
  genre: [String]
  bio: String
  country: String
  languages: [String]
  mood: [String]
  category: String
  profileImage: String
  coverImage: String
  songs: [Song]
  followers: [User]
  createdAt: Date!
}

enum ArtistRole {
  ARTIST
  ADMIN
}


type Song {
  _id: ID!
  title: String!
  artist: Artist!
  featuringArtist: [String]
  album: Album!
  trackNumber: Int
  genre: String
  producer: [String]
  composer: [String]
  label: String
  duration: Int!
  playCount: Int
  releaseDate: Date!
  downloadCount: Int
  likedByUsers: [User]
  trendingScore: Int
  tags: [String]
  lyrics: String
  artwork: String
  audioFileUrl: String
 audioHash: String
  createdAt: Date!
}



type Album {
  _id: ID!
  title: String!
  artist: Artist!
  releaseDate: Date
  songs: [Song]
  albumCoverImage: String
  createdAt: Date
}


type Query {
  allArtists: [Artist]
  artistProfile: Artist
  songsOfArtist: [Song]
  songHash(audioHash: String):Song
  albumOfArtist: [Album]
  getPresignedUrl(key: String!, operation: String!): String
  songUrls(
    songId: ID!
    artistId: ID!
  ): File
  
}

type AuthPayload_artist {
  artistToken: String!
  artist: Artist
}

type VerificationResponse {
  success: Boolean!
  message: String!
}

type ResendVerificationResponse {
  success: Boolean!
  message: String!
}

 type File {
   streamAudioFileUrl: String
}


type PresignedUrlResponse {
  url: String!
  urlToDownload: String! 
  urlToDelete: String! 
  expiration: String
}

type Mutation {
  createArtist(
    fullName: String!
    artistAka: String!
    email: String!
    password: String!
    role: String
    confirmed: Boolean
    selectedPlan: Boolean
  ): AuthPayload_artist

  sendVerificationEmail(email: String!): Boolean
  verifyEmail(token: String!): Boolean
  resendVerificationEmail(email: String!): ResendVerificationResponse!

  selectPlan(artistId: ID!, plan: String!): Artist
  getPresignedUrl(bucket: String!, key: String!, region: String!): PresignedUrlResponse
  getPresignedUrlDownload(bucket: String!, key: String!, region: String!): PresignedUrlResponse
  getPresignedUrlDelete(bucket: String!, key: String!, region: String!): PresignedUrlResponse
  
  artist_login(email: String!, password: String!): AuthPayload_artist
  deleteArtist(artistId: ID!): Artist

  updateArtistProfile(
    artistId: ID!
    bio: String
    country: String
    languages: [String]
    genre: [String]
    mood: [String]
    profileImage: String
    coverImage: String
  ): Artist


  addBio(bio: String): Artist
  addCountry(country: String): Artist
  addLanguages(languages: [String]): Artist
  addGenre(genre: [String]): Artist
  addCategory(category: String): Artist
  removeGenre(genre: [String]): Artist
  addProfileImage(profileImage: String): Artist
  addMood(mood: [String]): Artist


  createSong(
  title: String!
  featuringArtist: [String]
  albumId: ID!
  trackNumber: Int
  genre: String
  producer: [String]
  composer: [String]
  label: String
  duration: Int!
  releaseDate: Date!
  lyrics: String
  artwork: String
  audioFileUrl: String
  streamAudioFileUrl: String
 audioHash: String
  ): Song

  songUpload(file: Upload): File


  createAlbum(
    title: String!
    releaseDate: String
    songs:[String]
    albumCoverImage: String
    createdAt: String
  ): Album
  


   createCustomAlbum(
    title: String!
    releaseDate: String
    albumCoverImage: String
    createdAt: String
  ): Album

  albumById(
    albunId: ID!
  ): Album
  



  updateAlbum(
    albumId: ID!
    songId:[ID]
    albumCoverImage: String
  ): Album








  deleteSong(artistId: ID!, songId: ID!): Song

 

 

  deleteAlbum(albumId: ID!): Album
}
`;

export default typeDefs;
