

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
  mood: [String]
  subMoods: [String]
  producer: [Producer]
  composer: [Composer]
  label: String
  duration: Float! 
  playCount: Int
  releaseDate: Date!   
  downloadCount: Int
  likedByUsers: [User]  
   likedByMe: Boolean
   likesCount: Int
 trendingScore: Float

  tags: [String]
  lyrics: String
  artwork: String
  streamAudioFileUrl: String
  audioFileUrl: String
 beats: [Float]
 tempo: Float
 key: String
 mode: Float
 visibility: String
 timeSignature: Float
keyConfidence: Float
createdAt: Date!
}



type SongMetadata {
  songId: ID!
  title: String!
  artist: ID!
  genre: String!
  mood: String!
  subMoods: String
  tempo: Int
  
 
  duration: Int!

#populate them from artist Modal

  artistAka: String!
 country: String
 languages: [String]

#populate them from album modal

 album: Album
 albumTitle: String


}



type Producer {
  name: String
  role: String
}

type Composer {
  name: String
  contribution: String
}

input ProducerInput {
  name: String!
  role: String
}


input ComposerInput{
  name: String!
  contribution: String
}

enum UploadStatus {
  PENDING
  IN_PROGRESS
  DUPLICATE
  COMPLETED
  SUCCESS
  COPYRIGHT_ISSUE
  
  FAILED
}

enum UploadStep {
  INITIATED
  COMPLETED
  VALIDATING
  FAILED
  CHECKING_DUPLICATES
  UPLOADING
  PROCESSING
  FINALIZING
}

type UploadProgress {
  step: UploadStep!
  status: UploadStatus!
  message: String
  percent: Float
  isComplete: Boolean
}


type Subscription {
  songUploadProgress: UploadProgress
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
   audioFileUrl: String
}


type PresignedUrlResponse {
  url: String!
  urlToDownload: String! 
  urlToDelete: String! 
  expiration: String
}




 input NextSongInput {
    userId: ID!
    currentSongId: ID!
  }


  type NextSongPayload {
    ok: Boolean!
    songId: ID        
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

  songById(songId: ID!): Song
 getSongMetadata(songId: ID!): SongMetadata
 trendingSongs: [Song!]!
 similarSongs(songId: ID!): [Song]
 
  
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

   getPresignedUrlDownloadAudio(bucket: String!, key: String!, region: String!): PresignedUrlResponse

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




    updateSong(
      songId: ID!
  title: String!
  featuringArtist: [String]
  album: ID!
  trackNumber: Int
  genre: String
   producer: [ProducerInput]
  composer: [ComposerInput]
  label: String
  mood: [String]
  subMoods:[String]
  releaseDate: Date!
  lyrics: String
  artwork: String
  ): Song


addLyrics(
  songId: ID!
  lyrics: String
  
): Song

addArtwork(
  songId: ID!
  artwork: String
  
): Song


  songUpload(
    file: Upload
    tempo: Float
    beats: [Float]
    timeSignature: Float
  ): Song!


toggleVisibility(songId: ID!, visibility: String!): Song

deleteSong(
  songId: ID!
): Song


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



nextSongAfterComplete(input: NextSongInput!): NextSongPayload!

handlePlayCount(
  songId: String!
):Song






 

 

  deleteAlbum(albumId: ID!): Album
}
`;

export default typeDefs;
