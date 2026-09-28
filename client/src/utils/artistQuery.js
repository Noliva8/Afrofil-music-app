import { gql } from '@apollo/client';



export const ARTIST_PROFILE = gql`
query ArtistProfile($artistId: ID) {
  artistProfile(artistId: $artistId) {
    _id
    artistAka
    bio
    country
    region
    coverImage
    createdAt
    email
    fullName
    followers {
      _id
    }
    genre
    languages
    mood
    profileImage
    bookingAvailability
    songs {
      _id
      title
    }
  }
}
`
