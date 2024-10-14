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

type Favorite {
  _id: ID!
  user: User!
  songs: [Song]
  albums: [Album]
  playlists: [Playlist]
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
  songs: [Song]
  albums: [Album]
  artists: [Artist]
  genres: [Genre]
  playlists: [Playlist]
  comments: [Comment]
}

`;

module.exports = typeDefs;
