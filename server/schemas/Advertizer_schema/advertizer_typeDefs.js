const typeDefs = `

scalar Upload
scalar Date

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
enum AdStatus { draft waiting_for_approval active paused completed }
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

# ------------------------------------------- 

type Ad {

  # Basics ----
  id: ID!
  advertiserId: ID!
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




type Query {

  # Ad related queries
  getAdvertizer(_id: ID!): Advertizer
  getAdsByAdvertizer(advertizerId: ID!): [Ad]
  getAdPayments(advertizerId: ID!): [AdPayment]
  getAdPerformanceLogs(adId: ID!): [AdPerformanceLog]
  getPendingAds: [Ad] 
  ad(id: ID!): Ad
  adsByAdvertiser(advertiserId: ID!): [Ad!]!
 myAds(limit: Int = 25, offset: Int = 0): [Ad!]!
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









  logAdPerformance(
    adId: ID!
    viewerUserId: ID
    type: PerformanceType!
  ): AdPerformanceLog


}
`;

export default typeDefs;
