

const typeDefs = `
scalar Date

type User {
  _id: ID!
  username: String!
  email: String!
  role: UserRole
  following: [Artist]
  createdAt: Date!
}


enum UserRole {
  USER
  ADMIN
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












type Query {
  # Users
  users: [User]
  userById(userId: ID!): User
  searchUser(username: String!): User
 liked_songsByUser(userId: ID!): [Song]
 searched_songsByUser(userId: ID!): [Song]
 recommended_songsByUser(userId: ID!): [Song]
 downloaded_songsByUser(userId: ID!): [Song]
trendingSongs: [Song!]!






  
 
 





  # Playlists
  playlists: [Playlist]
  playlist(playlistId: ID!): Playlist

  # Comments
  comments: [Comment]
  commentsForSong(songId: ID!): [Comment]

 
}

type user_AuthPayload {
  userToken: String
  user: User
}



type Mutation {
  
  createUser(
    username: String!,
     email: String!, 
     password: String!
     ): user_AuthPayload

  login(
    email: String!, 
    password: String!): user_AuthPayload

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