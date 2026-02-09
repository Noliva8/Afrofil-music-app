

const typeDefs = `
scalar Date

type User {
  _id: ID!
  username: String!
  email: String!
  role: UserRole!
  subscription: Subscription
  adLimits: AdLimits
  following: [Artist!]!
  createdAt: Date!
  updatedAt: Date!

  # Computed/virtuals
  isPremium: Boolean!
  shouldSeeAds: Boolean!
  canSkipAd: Boolean!
}



enum UserRole {
  regular
  premium
}

type Subscription {
  status: SubscriptionStatus!
  periodEnd: Date
  planId: String

}


type DailyMixProfile {
  energy: Float
  tempo: String
  mood: String
  label: String
}

type MixTrackArtist {
  _id: ID
  artistAka: String
  profileImage: String
  country: String
  bookingAvailability: Boolean
}

type MixTrackAlbum {
  _id: ID
  title: String
  albumCoverImage: String
}

type DailyMixTrack {
  _id: ID
  id: ID
  songId: ID
  title: String
  artist: String
  artistName: String
  artistId: ID
  artistProfile: MixTrackArtist
  bookingAvailability: Boolean
  albumId: ID
  album: MixTrackAlbum
  genre: [String]
  mood: [String]
  subMoods: [String]
  score: Float
  artwork: String
  energy: Float
  tempo: String
  key: String
  mode: Int
  plays: Float
  duration: String
  durationSeconds: Float
  streamAudioFileUrl: String
  audioUrl: String
  likesCount: Int
  likedByMe: Boolean
  durationLabel: String
  label: String
}

type DailyMix {
  profileKey: String!
  profileLabel: String
  profile: DailyMixProfile
  tracks: [DailyMixTrack!]!
  generatedAt: Date
  userContext: MixProfileContext
}

type MixLocation {
  country: String
  region: String
  city: String
}

type TempoRange {
  min: Float
  max: Float
}

type MixProfileContext {
  moods: [String]
  subMoods: [String]
  genres: [String]
  tempoRange: TempoRange
  key: String
  mode: Int
  location: MixLocation
}

input MixLocationInput {
  country: String
  region: String
  city: String
}

input TempoRangeInput {
  min: Float
  max: Float
}

input MixProfileInput {
  moods: [String]
  subMoods: [String]
  genres: [String]
  tempoRange: TempoRangeInput
  key: String
  mode: Int
  location: MixLocationInput
}



enum SubscriptionStatus {
  ACTIVE
  NONE
  TRIALING
  PAST_DUE
  CANCELED
}

type AdLimits {
  skipsAllowed: Int!
  lastReset: Date!
  skipsUsedToday: Int! 
}








type Playlist {
  _id: ID!
  title: String!
  description: String
  songs: [Song]
  createdBy: User
  createdAt: Date!
}

enum NotificationStatus {
  PENDING
  ACCEPTED
  DECLINED
}

input SupportRequestInput {
  name: String!
  email: String!
  category: String
  message: String!
}

type SupportResponse {
  success: Boolean!
  message: String!
}






type UserNotification {
  _id: ID!
  userId: ID!
  bookingId: ID!
  messageId: ID
  type: NotificationStatus!
  message: String
  isArtistRead: Boolean
  isChatEnabled: Boolean
  isNotificationSeen: Boolean
  createdAt: Date
  updatedAt: Date
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

type Comment {
  _id: ID!
  content: String!
  user: User!
  song: Song
  createdAt: Date!
}






type userLocation{
 country: String
  countryCode: String
  state: String       
  province: String    
  region: String     
  city: String
}







type Query {

  notificationOnCreatedBookings: [UserNotification!]!

  notificationOnArtistMessages(
    messageId: ID
    bookingId: ID
  ): [UserNotification!]




  # Users
  users: [User]
  userById(userId: ID!): User
  userSubscription: Subscription
  dailyMix(profileInput: MixProfileInput, limit: Int = 20): DailyMix
  searchUser(username: String!): User
 liked_songsByUser(userId: ID!): [Song]
 searched_songsByUser(userId: ID!): [Song]
 recommended_songsByUser(userId: ID!): [Song]
 downloaded_songsByUser(userId: ID!): [Song]
  recentPlayedSongs(limit: Int = 50): [Song]
  likedSongs(limit: Int = 50): [Song]
  userPlaylists(limit: Int = 50): [Playlist]







  

  # Playlists
  playlists: [Playlist]
  playlist(playlistId: ID!): Playlist

  # Comments
  comments: [Comment]
  commentsForSong(songId: ID!): [Comment]
  userNotifications(status: NotificationStatus): [UserNotification!]!

 
}

input CreateUserInput {
  username: String!
  email: String!
  password: String!
  role: UserRole = regular
}

type UserAuthPayload {
  userToken: String!
  user: User!
}

type PasswordResetResponse {
  success: Boolean!
  message: String!
}





type Mutation {

 markSeenUserNotification(notificationId: ID!
isNotificationSeen: Boolean
): UserNotification


 createUser(input: CreateUserInput!): UserAuthPayload



  login(
    email: String!, 
    password: String!): UserAuthPayload

  updateUser(userId: ID!,
   username: String!,
  password: String!): User

  upgradeCurrentUserToPremium: User!
  cancelCurrentUserSubscription: User!

  requestPasswordReset(email: String!): PasswordResetResponse
  resetPassword(token: String!, newPassword: String!): PasswordResetResponse





  deleteUser(userId: ID!): String

  incrementPlayCount(userId: ID!, songId: ID!): PlayCount

  addDownload(userId: ID!, songId: ID!): Download

  addLikedSong(userId: ID!, songId: ID!): LikedSongs

  searched_Songs(userId: ID!, songId: ID!): SearchHistory

  removeLikedSong(userId: ID!, songId: ID!): Boolean
  markNotificationRead(notificationId: ID!): UserNotification!
  markMessagesReadByUser(bookingId: ID!): Boolean!

  

  sendSupportMessage(input: SupportRequestInput!): SupportResponse!

  createComment(
    songId: ID!,
     userId: ID!, 
     content: String!): Comment

      updateComment(
    commentId: ID!, 
    content: String!): Comment
 
 deleteComment(commentId: ID!): Comment

createPlaylist(title: String!, description: String, songs: [ID], createdBy: ID!): Playlist
addSongToPlaylist(playlistId: ID!, songId: ID!): Playlist
removeSongFromPlaylist(playlistId: ID!, songId: ID!): Playlist
reorderPlaylistSongs(playlistId: ID!, songIds: [ID!]!): Playlist
deletePlaylist(playlistId: ID!): Boolean









 detectUserLocation(
 lon: Float
  lat: Float
 ):userLocation

}
`;



export default typeDefs;
