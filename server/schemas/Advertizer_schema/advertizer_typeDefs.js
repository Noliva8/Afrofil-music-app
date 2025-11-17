const typeDefs = `

scalar Upload
scalar Date
scalar JSON

enum AdvertizerRole {
  advertizer
  admin
}

enum AdType {
  audio
  banner
  overlay
  cover
}

enum Status {
  pending
  approved
  expired
  rejected
}

enum PaymentStatus {
  pending
  succeeded
  failed
}

enum BrandTypes{
    creator
    business
    nonprofit
    other
}


enum PerformanceType {
  impression
  click
  playthrough
}

enum PlatformType {
  ios
  android
  all
}





type Advertizer {
  _id: ID!
  fullName: String!
  companyName: String!
  phoneNumber: String!
  businessEmail: String!
  role: AdvertizerRole!
  country: String!
  companyWebsite: String
  brandType: BrandTypes!
isSuperAdmin: Boolean
permissions:[String]
  isConfirmed: Boolean
  confirmationToken: String
  confirmationTokenExpire: Date
  isPhoneConfirmed: Boolean
  phoneCode: Int



  acceptedTerms: Boolean!
  acceptedTermsAt: Date
  termsVersion: String
  createdAt: Date
  updatedAt: Date
}

type AuthPayload_advertizer {
  advertizerToken: String!
  advertizer: Advertizer!
}

type ResendEmailResponse {
  success: Boolean!
  message: String
}





# Ad creation and price quote started ----

# 1. all enums ----

enum AdType { audio banner overlay }
enum TargetingScope { worldwide country city }
enum AdStatus { draft waiting_for_approval rejected active paused completed }
enum AUDIOADFORMAT {
  AUDIO_MPEG
  AUDIO_WAV
  AUDIO_AAC
  AUDIO_MP4
  AUDIO_X_M4A
  AUDIO_FLAC
  AUDIO_OGG
  AUDIO_OPUS
  AUDIO_WEBM
}

enum BANNERFORMAT {
   IMAGE_JPEG
  IMAGE_PNG
}

 enum UserTier {
    guest
    regular
    premium
  }

  enum Mood {
    Party
    Chill
    Gospel
    Heartbreak
    Traditional
    Romantic
    Motivational
    Cultural
  }


   enum SubMood {
    Worship
    Praise
    Traditional_Gospel
    Club_Anthem
    Wedding
    Breakup
    Street
    Motivation
    Prayer
    Rebellion
  }


    enum AdEvent {
    impression
    complete
    click
  }



enum PlaybackSource {
  # Core sources
  PLAYLIST
  ALBUM
  ARTIST
  TRACK

  # Dynamic
  SEARCH
  RADIO         # Seed-based (e.g. song/artist/genre)
  RECOMMENDATION
  DISCOVER

  # Editorial
  STATION       # Curated station (editorial/genre/mood)
  CHART
  GENRE
  MOOD
  TRENDING

  # User Activity
  LIKED
  HISTORY
  RECENT
  USER_GENERATED

  # Other
  PODCAST
  UNKNOWN
}

enum RepeatMode {
  OFF
  TRACK
  CONTEXT
}

# ------------------------------------------- 

type Ad {

  # Basics ----
  id: ID!
   advertiserId: ID!        
  advertiser: Advertizer
  campaignId: String!
  adTitle: String!
  description: String
  adType: AdType!

# locations & duration ----
  targeting: Targeting!       # add type Targeting below
  schedule: Schedule!         # add type Schedule below

# Pricing ----
  isCostConfirmed: Boolean!
  pricing: Pricing            # add type Pricing below

# Payment ----
  isPaid: Boolean!
  paidAt: Date

# Creative ----
  
  streamingOverlayAdUrl: String
  originalOverlayUrl: String 
  streamingBannerAdUrl: String 
  originalBannerAdUrl: String 
   masterAudionAdUrl: String 
   streamingAudioAdUrl: String 
   streamingFallBackAudioUrl: String 
   adArtWorkUrl: String 

# Performance Tracking ----
  analytics: Analytics          # add type Analytics below


# Status ----
  status: AdStatus!                   
  isApproved: Boolean!
  approvedAt: Date
  approvedBy: String
  rejectionReason: String

duration: Int
audioFormat: AUDIOADFORMAT
bannerFormat: BANNERFORMAT
bannerAdWidthPx: Int
bannerAdHeghtPx: Int


  createdAt: Date!
  updatedAt: Date!
}

# ----------------------------------------------


type Targeting {
  scope: TargetingScope!      
  countries: [String!]!    
  wholeCountry: Boolean!  
  city: String 
  state: String           
}

type Schedule {
  startDate: Date!
  endDate: Date!
 
}


type Analytics {
  plays: Int
  skips: Int
  avgPlayDuration: Int
  clicks: Int
  clickThroughRate: Float
  impressions: Int
  uniqueUsers: Int
  conversions: Int
  byCountry: [CountryPerf!]
  lastUpdated: Date
}

type Pricing {
  dailyRate: Float
  totalCost: Float
}

# ----------------------------------------------

# other external types

type CountryPerf {
  country: String
  impressions: Int
  clicks: Int
}



type Location {
  name: String!
  type: String! # 'city', 'state', or 'country'
  country: String!
  city: String
  state: String
}

type PriceQuote {
  currency: String!
  days: Int!
  perDay: Float!
  totalPrice: Float!
  scope: String!
  adType: String!
  basis: String!
  location: Location!
  marketSize: String!
  cityPopulation: Int
  isMajorCity: Boolean
   state: String
  
}




type CreateAdBasicResult {
  ad: Ad!
  quote: PriceQuote!
 
}






type AdPayment {
  _id: ID!
  ad: Ad!
  advertizer: Advertizer!
  amount: Float
  currency: String
  paymentStatus: PaymentStatus
  paymentMethod: String
  stripeSessionId: String
  paidAt: Date
  createdAt: Date
  updatedAt: Date
}

type AdPerformanceLog {
  _id: ID!
  ad: Ad!
  viewerUser: User
  timestamp: Date
  type: PerformanceType
}


type ConfirmPriceResponse {
  id: ID!                 
  clientSecret: String!  
  isCostConfirmed: Boolean!
   adType: String
  amount: Int!           
  currency: String!     
  location: String       
  adId: ID!              
  campaignId: String
}




type AdVariant {
  codec: String!
  pointer: String!  # NOT a URL; client will presign
}

type AdPayload {
  id: ID!
  type: String!
  duration: Int!
  variants: [AdVariant!]!
}


type AdDecision {
  decision: String!       
  reason: String
  retryAfter: Int
  ad: AdPayload
  metadata: JSON
}

type BookResult {
  ok: Boolean!
}




  type AdCreative {
    streamingOverlayAdUrl: String
    originalOverlayUrl: String
    streamingBannerAdUrl: String
    originalBannerAdUrl: String
    masterAudioAdUrl: String
    streamingAudioAdUrl: String
    streamingFallbackAudioUrl: String
    adArtworkUrl: String
  }

  type AdPick {
    campaignId: ID!
    adId: ID
    durationSec: Int!
    priority: Int!
    creative: AdCreative
  }

 
  type TrackStartPayload {
    ok: Boolean
    deduped: Boolean  
  }



  type TrackCompletePayload {
    ok: Boolean
    deduped: Boolean
    ad: AdPick
  }

   type TrackSkipPayload {
    ok: Boolean
    deduped: Boolean
     ad: AdPick
     }

       type TrackAdEventPayload {
    ok: Boolean
    deduped: Boolean
     ad: AdPick
  }

  type TrackEndPayload {
    ok: Boolean
    now: String
  }
  

  type PlaybackContextState {
  v: Int!                          
  
  userId: ID
  sessionId: ID

  # last known track & position
  trackId: ID!
  positionSec: Float!
  updatedAt: Date!
  queueIds: [ID!]! 
song: Song
  playbackContext: PlaybackContextOutput!
}

type PlaybackContextOutput {
  source: PlaybackSource!
  sourceId: ID
  sourceName: String
  queuePosition: Int!
  queueLength: Int!
  shuffle: Boolean!
  repeat: RepeatMode!
  contextUri: String
  radioSeed: String
  searchQuery: String
  recommendationType: String
}


  type TelemetryAck {
    ok: Boolean!
    now: String!
  }

type AdResponse {
  success: Boolean!
  ads: [Ad!]!
  error: String
}





# ----------------------------------------------


# Inputs for Ad

input TargetingInput {
  scope: TargetingScope!
  countries: [String!]!
  wholeCountry: Boolean!
  city: String
  state: String
}

# Accept "YYYY-MM-DD" from UI
input ScheduleInput {
  startDate: String!
  endDate: String!
}

input CreateAdBasicInput {
  adTitle: String!
  adType: AdType!
  targeting: TargetingInput!
  schedule: ScheduleInput!
  description: String
}

input PlayerContextInput {
  userId: ID!
  userTier: String!
  locationCountry: String
  locationState: String
  locationCity: String
  device: String
  availableAdTime: Int
  wantType: String
}







 input GeoInput {
    country: String
    state: String
    city: String
    latitude: Float
    longitude: Float
    accuracyMeters: Int
    source: String
  }


input PlaybackContextInput {
  source: PlaybackSource!
  sourceId: ID
  sourceName: String
  queuePosition: Int!
  queueLength: Int!
  shuffle: Boolean!
  repeat: RepeatMode!
  contextUri: String

  # Additional context fields
  radioSeed: String
  searchQuery: String
  recommendationType: String
}


input SavePlaybackContextStateInput {
  userId: ID
  sessionId: ID
  trackId: ID!
  positionSec: Float! = 0
  playbackContext: PlaybackContextInput!
}



input TrackStartInput {
  # Core Identity
  userId: ID!
  sessionId: ID!
  
  # Device & Tier
  device: String!          
  platform: String!       
  userTier: String!         
  
  # Location
  geo: GeoInput
  
  # Current Song
  trackId: ID!
  trackGenre: String!
  trackMood: String!
  trackSubMood: String
  artistId: ID!
  albumId: ID!
  tempo: Int!               
  duration: Int!
  country: String            
  
  # Playback Context

  playbackContext: PlaybackContextInput!        
  
  # Technical
  eventId: ID              
}


input TrackCompleteInput {
  eventId: ID
  userId: ID!
  sessionId: ID!
  trackId: ID!
  trackGenre: String
  ms_listened: Int
  mood: String
  subMoods: String  
}



  input TrackSkipInput {
    eventId: ID
    userId: ID!
    sessionId: ID!
    trackId: ID!
    trackGenre: String
    mood: String
    subMood: String
  }



   input TrackAdEventInput {
    userId: ID!
    campaignId: ID!
    adId: ID
    event: String!   
    completed: Boolean
    clicked: Boolean
  }

  input TrackProgressInput {
    userId: ID!
    sessionId: ID!
    trackId: ID!
    positionSec: Int!  
    heartbeatSec: Int
  }


  input TrackEndInput {
    userId: ID!
    sessionId: ID!
    trackId: ID!
    durationSec: Int!
    listenedSec: Int!
    finished: Boolean
  }




input UserLocation {
  country: String!
  state: String
  city: String
}


input ScheduleInput {
  startDate: String!
  endDate: String!
}





















type Query {

  # Ad related queries
  getAdvertizer(_id: ID!): Advertizer
  getAdsByAdvertizer(advertizerId: ID!): [Ad]
  getAdPayments(advertizerId: ID!): [AdPayment]
  getAdPerformanceLogs(adId: ID!): [AdPerformanceLog]
  getPendingAds: [Ad] 
  ad(id: ID!): Ad
  adsByAdvertiser(advertiserId: ID!): [Ad!]!
  myAds: [Ad!]!
   getPlaybackContextState(userId: ID, sessionId: ID): PlaybackContextState

getAudioAd(userLocation: UserLocation): AdResponse!
   # -----------------------------------------------


}

type Mutation {

 # mutation Advertizer related
  registerAdvertizer(
    fullName: String!
    companyName: String!
    phoneNumber: String!
    businessEmail: String!
    password: String!
    brandType: BrandTypes!
    country: String!
    companyWebsite: String
    acceptedTerms: Boolean!
    termsVersion: String
    
  ): AuthPayload_advertizer


  resendAdvertizerVerificationEmail(businessEmail: ID!): ResendEmailResponse


confirmAdvertizerPhone(
  phoneNumber: String!
  code: Int!
): Boolean!

  confirmAdvertizerEmail(token: String!): Advertizer
  loginAdvertizer(
    businessEmail: String!
    password: String!
  ): AuthPayload_advertizer


 # -----------------------------------------------

 # mutation Ad related

    createAdBasic(advertiserId: ID!, input: CreateAdBasicInput!): CreateAdBasicResult!

confirmPrice(
  adId: ID!
  isCostConfirmed: Boolean!
   adTitle: String!
   campaignId: String!
   duration: Int
   adType: String
   amount: Float
   currency: String!
   location: String!
):ConfirmPriceResponse



    updateAdBasic(id: ID!, input: CreateAdBasicInput!): Ad!
    


  createAdPayment(
    adId: ID!
    advertiserId: ID!
    amount: Float!
    currency: String
    paymentMethod: String
    stripeSessionId: String
    paidAt: Date
  ): AdPayment


audioAdUpload( 
  adId: ID!
  file: Upload!
   ): Ad

uploadArtwork(
  adId: ID!
  file: Upload!
):Ad



BannerAdUpload( 
  adId: ID!
   file: Upload!
   ): Ad


   overlayAdUpload( 
  adId: ID!
   file: Upload!
   ): Ad

AdAprouve(adId: ID! campainId: String): Ad
AdReject(adId: ID campainId: String rejectionReason: String): Ad

  logAdPerformance(
    adId: ID!
    viewerUserId: ID
    type: PerformanceType!
  ): AdPerformanceLog



   adDecisionEngine(player: PlayerContextInput!): AdDecision!
  adBumpServed(userId: ID!): BookResult!  





  trackStart(input: TrackStartInput!): TrackStartPayload!

    trackComplete(input: TrackCompleteInput!): TrackCompletePayload!
    trackSkip(input: TrackSkipInput!): TrackSkipPayload!
    trackAdEvent(input: TrackAdEventInput!): TrackAdEventPayload!
    trackEnd(input: TrackEndInput!): TrackEndPayload!

    savePlaybackContextState(input: SavePlaybackContextStateInput!): Boolean!  

    clearPlaybackContextState(userId: ID, sessionId: ID): Boolean!
    


}
`;

export default typeDefs;
