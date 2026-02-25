

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
  region: String
  languages: [String]
  mood: [String]
  category: String
  profileImage: String
  coverImage: String
  songs: [Song]
  followers: [User]
  followerCount: Int
  artistDownloadCounts: Int
  bookingAvailability: Boolean
  createdAt: Date!
}

enum ArtistRole {
  ARTIST
  ADMIN
}


type Song {
  _id: ID!
  title: String
  artist: Artist       
  featuringArtist: [String]  
  album: Album 
    bucket: String 
    S3Key: String 
    songUploadStatus: String 

  trackNumber: Int
  genre: String
  mood: [String]
  subMoods: [String]
  producer: [Producer]
  composer: [Composer]
  label: String
  artistFollowers: Int
  artistDownloadCounts: Int
  duration: Float 
  playCount: Int
  releaseDate: Date   
  downloadCount: Int
  likedByUsers: [User]  
   likedByMe: Boolean
   likesCount: Int
   shareCount: Int
 trendingScore: Float

  tags: [String]
  lyrics: String
  artwork: String
  streamAudioFileUrl: String
  premiumStreamAudioFileUrl: String
  audioFileUrl: String
  artworkKey: String
  audioStreamKey: String
 beats: [Float]
 tempo: Float
 key: String
 mode: Float
 visibility: String
 timeSignature: Float
keyConfidence: Float
createdAt: Date!

processingStartedAt: Date
processingFinishedAt: Date
processingError: String
processingAttempts: Int

  artworkPresignedUrl: String       
  audioPresignedUrl: String          
}


type SongUploadInit{
song: Song!
url: String!
 key: String!
}



enum songUploadStatus {
UPLOADING
UPLOADED
PROCESSING
READY
FAILED
DUPLICATE
}


# ---------------------------
# BOOKING ENUMS
# ---------------------------

enum BookingEventType {
  WEDDING
  CONCERTS
  CLUB
  FESTIVAL
  CORPORATE
  PRIVATE
  OTHER
}

enum BookingBudgetRange {
  RANGE_500_1000
  RANGE_1000_3000
  RANGE_3000_5000
  RANGE_5000_PLUS
  FLEXIBLE
}

enum BookingPerformanceType {
  DJ
  LIVE
  ACOUSTIC
  BACKING_TRACK
}

enum BookingStatus {
  PENDING
  ACCEPTED
  DECLINED
}

enum BookingLength {
  MIN_30
  MIN_60
  MIN_90
}

# ---------------------------
# BOOKING SUB-TYPES
# ---------------------------

type BookingLocation {
  city: String!
  country: String!
  venue: String
}

input BookingLocationInput {
  city: String!
  country: String!
  venue: String
}

enum MessageSender {
  ARTIST
  USER
}

type Message {
  _id: ID!
  bookingId: ID!
  senderId: ID!
  senderType: MessageSender!
  content: String!
  isRead: Boolean!
  readAt: Date
  createdAt: Date!
  updatedAt: Date!
  artistId: Artist
  userId: User
  readByArtist: Boolean
  readByUser: Boolean
}

type ConversationSummary {
  bookingId: ID!
  eventType: String
  songTitle: String
  location: BookingLocation
  isChatEnabled: Boolean!
  lastMessage: Message
  unreadCount: Int!
  userName: String
  eventDate: Date
  artistName: String
}

input SendMessageInput {
  bookingId: ID!
  content: String!
}

type ArtistResponse {
  message: String
  respondedAt: Date
}

input ArtistResponseInput {
  message: String
  respondedAt: Date
}

# ---------------------------
# MAIN TYPE
# ---------------------------

type BookArtist {
  _id: ID!
  artist: Artist!
  user: User!
  song: Song

  eventType: BookingEventType!
  eventDate: Date!

  location: BookingLocation!

  budgetRange: BookingBudgetRange!
  performanceType: BookingPerformanceType

  setLength: BookingLength
  customSetLength: Int

  message: String

  status: BookingStatus!
  artistResponse: ArtistResponse

  createdAt: Date!
  updatedAt: Date!
}

# ---------------------------
# INPUTS
# ---------------------------

input CreateBookArtistInput {
  artistId: ID!
  songId: ID

  eventType: BookingEventType!
  eventDate: Date!

  location: BookingLocationInput!

  budgetRange: BookingBudgetRange!
  performanceType: BookingPerformanceType

  setLength: BookingLength
  customSetLength: Int

  message: String
}

input RespondToBookingInput {
  bookingId: ID!
  status: BookingStatus!
  message: String
}

# ---------------------------
# MUTATIONS
# ---------------------------

type CreateBookArtistPayload {
  booking: BookArtist!
}

type RespondToBookingPayload {
  booking: BookArtist!
}


type ProcessedSong {
  id: ID!
  title: String!
  artistAka: String!
  artistId: ID!
  artistBio: String
  country: String
  albumId: ID!
  albumTitle: String!
  albumReleaseYear: String!
  genre: String
  mood: String
  subMood: String
  plays: Int!
  downloadCount: Int!
  artistFollowers: Int!
  artistDownloadCounts: Int!
  playCount: Int!
  shareCount: Int!
  likesCount: Int!
  likedByMe: Boolean!
  durationSeconds: Int
  artworkKey: String!
  artworkBlur: String
  artworkColor: String
  profilePictureKey: String
  coverImageKey: String
  albumCoverImageKey: String
  streamAudioFileKey: String
  audioUrl: String
  streamAudioFileUrl: String
  lyrics: String
  credits: String
  label: String
  featuringArtist: [String]
  composer: [String]
  producer: [String]
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

enum RadioStationType {
  ARTIST_RADIO
  GENRE_RADIO
  MOOD_RADIO
  ERA_RADIO
  DISCOVER_RADIO
  USER_RADIO
  MIX_RADIO
}

enum RadioSeedType {
  ARTIST
  GENRE
  MOOD
  TRACK
  ERA
}

type RadioSeed {
  seedType: RadioSeedType!
  seedId: String!
}

type RadioStation {
  _id: ID!
  name: String!
  description: String
  type: RadioStationType!
  seeds: [RadioSeed!]!
  coverImage: String
  createdBy: Artist
  visibility: String
  createdAt: Date!
  updatedAt: Date!
}

input ProducerInput {
  name: String!
  role: String
}


input ComposerInput{
  name: String!
  contribution: String
}

input RadioSeedInput {
  seedType: RadioSeedType!
  seedId: String!
}

input CreateRadioStationInput {
  name: String!
  description: String
  type: RadioStationType!
  seeds: [RadioSeedInput!]!
  coverImage: String
  visibility: String
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
  newMessage(bookingId: ID!): Message!
}






type Album {
  _id: ID!
  title: String!
  artist: Artist
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
  url: String
  urlToDownload: String 
  urlToDelete: String 
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

type SongConnection {
  songs: [Song!]!
  totalCount: Int!
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
}

type SimilarSongsResponse{
  context: ID!
  songs:[Song!]!
  expireAt: String!
}








type PlaybackTrack {
  id: ID!
  title: String
  url: String
  audioUrl: String
  audioKey: String
  artworkKey: String
  fullUrl: String
  fullUrlWithAds: String
  teaserUrl: String
  isTeaser: Boolean
  artworkUrl: String
  artworkPresignedUrl: String
  artist: String
  artistName: String
  artistId: ID
  artistBio: String
  artistFollowers: Int
  artistDownloadCounts: Int
  isFollowing: Boolean
  albumId: ID
  albumName: String
  releaseYear: Int
  label: String
  featuringArtist: [String]
  duration: Float
  durationSeconds: Float
  country: String
  mood: [String]
  subMood: [String]
  tempo: Float
  playCount: Int
  likesCount: Int
  likedByMe: Boolean
  shareCount: Int
  downloadCount: Int
  credits: [PlaybackCredit]
  lyrics: String
}


type PlaybackCredit {
  name: String
  role: String
  type: String
}

input PlaybackCreditInput {
  name: String
  role: String
  type: String
}

input PlaybackTrackInput {
  id: ID!
  title: String
  url: String
  audioUrl: String

  fullUrl: String
  fullUrlWithAds: String
  teaserUrl: String
  isTeaser: Boolean
  artworkUrl: String

  artworkKey: String
  audioKey: String

  artworkPresignedUrl: String
  artist: String
  artistName: String
  artistId: ID
  artistBio: String
  artistFollowers: Int
  artistDownloadCounts: Int
  isFollowing: Boolean
  albumId: ID
  albumName: String
  releaseYear: Int
  label: String
  featuringArtist: [String]
  duration: Float
  durationSeconds: Float
  country: String
  mood: [String]
  subMood: [String]
  tempo: Float
  playCount: Int
  likesCount: Int
  likedByMe: Boolean
  shareCount: Int
  downloadCount: Int
  credits: [PlaybackCreditInput]
  lyrics: String
}


type PlaybackSession {
  track: PlaybackTrack!
  currentTime: Float!
  queue: [PlaybackTrack!]!
  wasPlaying: Boolean!
  volume: Float
  isMuted: Boolean
  shuffle: Boolean
  repeat: Boolean
  adState: AdResumeState
  updatedAt: String
}

type AdResumeState {
  songsPlayed: Int
  songsSinceLastBreak: Int
  totalAdBreaks: Int
  adSequenceCounter: Int
  lastAdPlayedAt: Float
}




input PlaybackSessionInput {
  track: PlaybackTrackInput!
  currentTime: Float!
  queue: [PlaybackTrackInput!]!
  wasPlaying: Boolean!
  volume: Float
  isMuted: Boolean
  shuffle: Boolean
  repeat: Boolean
  adState: AdResumeStateInput
}

input AdResumeStateInput {
  songsPlayed: Int
  songsSinceLastBreak: Int
  totalAdBreaks: Int
  adSequenceCounter: Int
  lastAdPlayedAt: Float
}

enum ViewPoint {
  RAIL
  SHOW_ALL
}









type Query {

  # Get messages for a booking
  getmessages(bookingId: ID!): [Message!]!

   # Get unread count for current user
  unreadCount: Int!

# Get conversation between user and artist
  conversation(artistId: ID!, userId: ID!): [Message!]!



  allArtists: [Artist]
  artistProfile: Artist
  songsOfArtist: [Song]
 getArtistSongs(artistId: ID!): [Song]
  songHash(audioHash: String):Song
  albumOfArtist: [Album]
  getPresignedUrl(key: String!, operation: String!): String
  songUrls(
    songId: ID!
    artistId: ID!
  ): File
  artistBookings(status: BookingStatus): [BookArtist!]!
  bookingMessages(bookingId: ID!): [Message!]!
  messageConversations: [ConversationSummary!]!
  unreadMessages(bookingId: ID!): Int!

  songById(songId: ID!): Song
  publicSong(songId: ID!): Song
 getSongMetadata(songId: ID!): SongMetadata
  trendingSongs(limit: Int!): [Song!]!
  
    trendingSongsV2(limit: Int!): [Song!]!

  processedTrendingSongs: [ProcessedSong!]!

 newUploads(limit: Int!): [Song!]!

  suggestedSongs(limit: Int = 20): [Song!]!
 songOfMonth: Song
 similarSongs(songId: ID!): SimilarSongsResponse!
 radioStations(type: RadioStationType, visibility: String = "public"): [RadioStation!]!
 radioStation(stationId: ID!): RadioStation
 radioStationSongs(stationId: ID!): [Song!]!
 exploreSongs(type: String!, value: String!): [Song!]!
 searchCatalog(query: String!, limit: Int = 12): SearchResults!

  songsLikedByMe(
    limit: Int = 20
    offset: Int = 0
  ): SongConnection!
  
  playbackSession: PlaybackSession
   getAlbum(albumId: ID!): Album
   otherAlbumsByArtist(albumId: ID!, artistId: ID!): [Album]
}

type SearchResults {
  songs: [Song!]!
  artists: [Artist!]!
  albums: [Album!]!
}


type Mutation {

# Send message
  sendMessage(input: SendMessageInput!): Message!
  
  # Mark messages as read
  markAsRead(messageIds: [ID!]!): Boolean!
  
  # Mark all messages in booking as read
  markBookingAsRead(bookingId: ID!): Boolean!





  createArtist(
    fullName: String!
    artistAka: String!
    email: String!
    password: String!
    country: String!
    region: String!
    role: String
    confirmed: Boolean
    selectedPlan: Boolean
  ): AuthPayload_artist

  sendVerificationEmail(email: String!): Boolean
  verifyEmail(token: String!): Boolean
  resendVerificationEmail(email: String!): ResendVerificationResponse!
  createRadioStation(input: CreateRadioStationInput!): RadioStation!

  selectPlan(artistId: ID!, plan: String!): Artist
  getPresignedUrl(bucket: String!, key: String!, region: String!): PresignedUrlResponse
  getPresignedUrlDownload(bucket: String!, key: String!, region: String): PresignedUrlResponse

   getPresignedUrlDownloadAudio(bucket: String!, key: String!, region: String): PresignedUrlResponse

  getPresignedUrlDelete(bucket: String!, key: String!, region: String!): PresignedUrlResponse
  
  artist_login(email: String!, password: String!): AuthPayload_artist
  
  deleteArtist(artistId: ID!): Artist

  updateArtistProfile(
    artistId: ID!
    bio: String
    country: String
    region: String
    languages: [String]
    genre: [String]
    mood: [String]
    profileImage: String
    coverImage: String
  ): Artist


  addBio(bio: String): Artist
  addCountry(country: String): Artist
  addRegion(region: String): Artist
  addLanguages(languages: [String]): Artist
  addGenre(genre: [String]): Artist
  addCategory(category: String): Artist
  removeGenre(genre: [String]): Artist
  addProfileImage(profileImage: String): Artist
  addMood(mood: [String]): Artist


  toggleBookingAvailability(available: Boolean!): Artist





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



  
  newSongUpload(
  filename: String!, 
  mimetype: String!, 
  region: String!, 
  bucket: String!
  ): SongUploadInit!

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

 shareSong(songId: ID!): Song

toggleLikeSong(songId: ID!): Song

 savePlaybackSession(data: PlaybackSessionInput!): Boolean!


handleFollowers(
artistId: ID!
userId: ID!
): Artist

handleDownload(
 artistId: ID!
 userId: ID!
 songId: ID!
 role: String!
): Song

handleArtistDownloadCounts(
 artistId: ID!
 userId: ID!
 role: String!
): Artist

  deleteAlbum(albumId: ID!): Album






  createBookArtist(input: CreateBookArtistInput!): CreateBookArtistPayload!
  respondToBooking(input: RespondToBookingInput!): RespondToBookingPayload!

  


}
`;

export default typeDefs;
