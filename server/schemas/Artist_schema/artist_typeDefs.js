

const typeDefs = `
scalar Date
scalar Upload

type Artist {
_id: ID!
fullName: String!
artistAka: String!
email: String!
confirmed: Boolean!
role: ArtistRole
genre: [String],
bio: String,
country: String!,
languages: [String],
mood: [String],
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
  artists: [Artist!]!
  album: Album
  genre: Genre
  duration: Int!
  playCount: Int!
  releaseDate: Date! 
  downloadCount: Int
  likedByUsers: [User]
  trendingScore: Int
  tags: [String]
  audioFileUrl: String!
  audioHash: String! 
  createdAt: Date!
}

type Album {
  _id: ID!
  title: String!
  artist: Artist!
  releaseDate: Date
  songs: [Song]
  albumCoverImage: String!
  createdAt: Date!
}

type Query {
  allArtists: [Artist]
  artistById(artistId: ID!): Artist
  songsOfArtist(artistId: ID!): [Song]
  
   albumOfArtist(artistId: ID!): Album
  
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

type Mutation {
  
 createArtist(
 fullName: String!
  artistAka: String!, 
  email: String!,
  password: String!,
  role: String,
  confirmed: Boolean

): AuthPayload_artist

 sendVerificationEmail(email: String!): Boolean
 verifyEmail(token: String!): Boolean

  resendVerificationEmail(email: String!): ResendVerificationResponse!

     addProfileImage(
       artistId: ID!,
       profileImage: Upload
     ): Artist

     addCoverImage(
      artistId: ID!,
      coverImage: Upload
     ): Artist


  artist_login(
    email: String!,
    password: String!): AuthPayload_artist


  updateArtist(
   fullName: String!
    artistAka: String!,
    email: String!,
    password: String!,
    bio: String,
    coverImage: Upload! 
  ): Artist


  deleteArtist(
    artistId: ID!,
  ): Artist


  createSong(
    title: String!,
     artistId: ID!,
      albumId: ID, 
     genre: String,
      duration: Int!, 
      releaseDate: String!, 
      audioFileUrl: Upload!
       ): Song

      

  updateSong(songId: ID!,
  title: String!,
  releaseDate: String!, 
  audioFileUrl: Upload!
   ): Song

  deleteSong(artistId: ID!,
  songId: ID!): Song



  createAlbum(
    title: String!, 
    artistId: ID!,
   releaseDate: String!
    songId: ID!, 
  ): Album

  updateAlbum(
  albumId: ID!
   title: String!, 
   releaseDate: String!
   songId: ID, 
  ): Album

  deleteAlbum(albumId: ID!): Album

}
`;

export default typeDefs;