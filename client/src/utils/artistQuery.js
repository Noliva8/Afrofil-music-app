import { gql } from '@apollo/client';



export const ARTIST_PROFILE = gql`
query Query {
  artistProfile {
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
    songs {
      _id
      title
    }
  }
}
`
