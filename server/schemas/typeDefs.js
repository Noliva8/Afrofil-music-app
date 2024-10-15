const typeDefs = `
scalar Date

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

type Mutation {
  createUser(username: String!, password: String!, email: String!): User
  updateUser(userId: ID!, newData: UserUpdateInput!): User
  deleteUser(userId: ID!): String

  createSong(title: String!, artistId: ID!, albumId: ID, genreId: ID): Song
  updateSong(songId: ID!, updatedData: SongUpdateInput!): Song
  deleteSong(songId: ID!): String

  createAlbum(title: String!, artistId: ID!, releaseDate: String!): Album
  updateAlbum(albumId: ID!, updatedData: AlbumUpdateInput!): Album
  deleteAlbum(albumId: ID!): String

  createComment(songId: ID!, userId: ID!, content: String!): Comment
  updateComment(commentId: ID!, updatedContent: String!): Comment
  deleteComment(commentId: ID!): String

  createMatchup(title: String!, description: String!, options: [String!]!): Matchup
  createVote(matchupId: ID!, option: String!): Matchup
}


`;

module.exports = typeDefs;
