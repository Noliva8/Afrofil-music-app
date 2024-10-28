const typeDefs = `
scalar Date
scalar Upload

type User {
  _id: ID!
  username: String!
  email: String!
  likedSongs: [Song]
  playlists: [Playlist]
  searchHistory: [Song]
  playCounts: [PlayCount]
  downloads: [Download]
  recommendedSongs: [RecommendedSong]
  createdAt: Date!
}

type PlayCount {
  song: Song
  count: Int
}

type Download {  
  song: Song
  downloadedAt: Date!
}

type RecommendedSong {
  song: Song 
  algorithm: String
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
  recommendedFor: [Recommendation]
  audioFilePath: String!
  audioHash: String! 
  createdAt: Date!
}

type Recommendation {
  user: User
  algorithm: String
}

type Album {
  _id: ID!
  title: String!
  artist: [Artist!]!
  releaseDate: Date
  songs: [Song]
  genre: Genre
  coverImage: String!
  createdAt: Date!
}

type Artist {
  _id: ID!
  name: String!
  bio: String
  coverImage: String
  songs: [Song] 
  albums: [Album] 
  createdAt: Date!
}

type Genre {
  _id: ID!
  name: String!
  description: String
  songs: [Song]
  createdAt: Date!
}

type Playlist {
  _id: ID!
  title: String! 
  description: String
  songs: [Song]
  createdBy: User
  createdAt: Date!
}

type Comment {
  _id: ID!
  content: String! 
  user: User!
  song: Song
  createdAt: Date! 
}

type Query {
  users: [User]
  userById(userId: ID!): User
  searchUser(username: String!): User


  songs: [Song]
  song(songId: ID!): Song
  searchSong(title: String, artist: String): [Song]


  albums: [Album]
   album(albumId: ID!): Album
   searchAlbum(title: String, artist: String): Album
   
  artists: [Artist]
artist(artistId: ID!): Artist
songsByArtist(name: String ): [Song]


  genres: [Genre]
  genre(genreId: ID!): Genre
  songsbyGenre(name: String): [Song]

  playlists: [Playlist]
  playlist(playlistId: ID!): Playlist

  comments: [Comment]
  commentsForSong(songId: ID!): [Comment] 
}

type AuthPayload {
  token: String
  user: User
}





type Mutation {
  
  createUser(
    username: String!,
     email: String!, 
     password: String!
     ): AuthPayload

  login(
    email: String!, 
    password: String!): AuthPayload
  updateUser(userId: ID!,
   username: String!,
  password: String!): User
  deleteUser(userId: ID!): String


  createArtist(
    name: String!,
    bio: String,
    coverImage: Upload! 
  ): Artist

  updateArtist(
    artistId: ID!,
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
      duration: INT!, 
      releaseDate: String!, 
      audioFilePath: Upload!
       ): Song

  updateSong(songId: ID!,
  title: String!,
  releaseDate: String!, 
  audioFilePath: Upload!
   ): Song

  deleteSong(artistId: ID!,
  songId: ID!): Song



  createAlbum(
    title: String!, 
   releaseDate: String!
  artistId: ID!,
  songId: ID, 
  ): Album

  updateAlbum(
    albumId: ID!
   title: String!, 
   releaseDate: String!
   songId: ID, 
  ): Album

  deleteAlbum(albumId: ID!): Album


  createComment(
    songId: ID!,
     userId: ID!, 
     content: String!): Comment

  updateComment(
    commentId: ID!, 
    content: String!): Comment

  deleteComment(commentId: ID!): Comment

 
}
`;

module.exports = typeDefs;
