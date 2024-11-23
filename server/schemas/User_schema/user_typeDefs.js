

const typeDefs = `
scalar Date

type User {
  _id: ID!
  username: String!
  email: String!
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

type LikedSongs {
  _id: ID!
  user: User
  liked_songs: [Song]
  createdAt: Date!
}

type SearchHistory {
  _id: ID!
  user: User
  searched_songs: [Song]
  createdAt: Date!
}

type PlayCount {
  _id: ID!
  user: User
  played_songs: [Song]
  count: Int
  createdAt: Date!
}

type Download {
  _id: ID!
  user: User
  downloaded_songs: [Song]
  createdAt: Date!
}

type Recommended {
  _id: ID!
  user: User
  recommended_songs: [Song]
  algorithm: String
  createdAt: Date!
}

type Comment {
  _id: ID!
  content: String!
  user: User!
  song: Song
  createdAt: Date!
}

type Song {
  _id: ID!
  title: String!
  artist: Artist
  album: Album
  genre: Genre
  duration: Int!
  releaseDate: Date!
}

type Artist {
  artistAka: String!
  bio: String
  coverImage: String!
}

type Album {
  title: String!
  artist: Artist
  releaseDate: Date!
  songs: [Song]
  coverImage: String!
}

type Genre {
  _id: ID!
  name: String!
}

type Query {
  # Users
  users: [User]
  userById(userId: ID!): User
  searchUser(username: String!): User

 
 liked_songsByUser(userId: ID!): [Song]
 searched_songsByUser(userId: ID!): [Song]
 recommended_songsByUser(userId: ID!): [Song]
 downloaded_songsByUser(userId: ID!): [Song]


  # Songs
  songs: [Song]
  song(songId: ID!): Song
  searchSong(title: String, artist: String): [Song]

  # Albums
  albums: [Album]
  album(albumId: ID!): Album
  searchAlbum(title: String, artist: String): Album

  # Artists
  artists: [Artist]
  artist(artistId: ID!, songId: ID!): Artist
  songsByArtist(name: String): [Song]

  # Genres
  genres: [Genre]
  genre(genreId: ID!): Genre
  songsByGenre(name: String): [Song]

  # Playlists
  playlists: [Playlist]
  playlist(playlistId: ID!): Playlist

  # Comments
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

  incrementPlayCount(userId: ID!, songId: ID!): PlayCount

  addDownload(userId: ID!, songId: ID!): Download

  addLikedSong(userId: ID!, songId: ID!): LikedSongs

  searched_Songs(userId: ID!, songId: ID!): SearchHistory

  recommended_songs(userId: ID!, songId: ID!, algorithm: String): Recommended

  removeLikedSong(userId: ID!, songId: ID!): Boolean

  createComment(
    songId: ID!,
     userId: ID!, 
     content: String!): Comment

      updateComment(
    commentId: ID!, 
    content: String!): Comment
 
 deleteComment(commentId: ID!): Comment

 createPlaylist(title: String!, description: String, songs: [ID], createdBy: ID!): Playlist

}

`;

export default typeDefs;