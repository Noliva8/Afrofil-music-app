

const typeDefs = `
scalar Date
scalar Upload

type Artist {
_id: ID!
firstname: String!
lastname: String!
artistAka: String!
email: String!
role: String!
profileImage: String
coverImage: String
followers: [User]
createdAt: Date!
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
  genre: Genre
  albumCoverImage: String!
  createdAt: Date!
}

type Genre {
  _id: ID!
  name: String!
  description: String
  songs: [Song]
  createdAt: Date!
}


type Query {
  allArtists: [Artist]
  artistById(artistId: ID!): Artist
  songsOfArtist(artistId: ID!): [Song]
  
   albumOfArtist(artistId: ID!): Album
  
  genreOfSongsOfArtist(songId: ID!, artistId: ID!): [Song]

}

type AuthPayload_artist {
  token: String
  artist: Artist
}

type Mutation {
  
  createArtist(
    firstname: String!,
    lastname: String!,
    artistAka: String!,
    email: String!, 
    password: String!
     ): AuthPayload_artist

  artist_login(
    email: String!, 
    artistAka: String!, 
    password: String!): AuthPayload_artist

  updateArtist(
    artistId: ID!,
    firstname: String!,
    lastname: String!,
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
      genreId: ID, 
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