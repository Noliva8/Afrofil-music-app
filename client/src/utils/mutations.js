import { gql } from '@apollo/client';

export const CREATE_USER = gql`
mutation CreateUser($username: String!, $email: String!, $password: String!) {
  createUser(username: $username, email: $email, password: $password) {
     userToken
    user {
      username
      email
      _id
    }
  }
}
`;

export const LOGIN_USER = gql`
  mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
     userToken
    user {
      username
      email
      _id
      createdAt
    }
  }
}
`;

export const CREATE_PLAYLIST = gql`
mutation CreatePlaylist($title: String!, $createdBy: ID!, $description: String) {
  createPlaylist(title: $title, createdBy: $createdBy, description: $description) {
    title
    description
    createdBy {
      username
    }
    createdAt
    _id
    songs {
      title
      releaseDate
      duration
      audioFileUrl
      artist {
        artistAka
        _id
      }
      _id
      genre {
        name
        _id
      }
    }
  }
}
`;

export const CREATE_ARTIST = gql`
mutation createArtist($fullName: String!, $artistAka: String!, $email: String!, $password: String!) {
  createArtist(fullName: $fullName, artistAka: $artistAka, email: $email, password: $password) {
    artist {
      _id
      artistAka
      confirmed
      selectedPlan
      role
      fullName
      email
    }
    artistToken
  }
}
`;


export const VERIFYING_EMAIL =gql`
mutation verifyEmail($artistToken: String!) {
  verifyEmail(artistToken: $artistToken) {
    message
    success
  }
}
`

export const ARTIST_LOGIN = gql`
mutation artist_login($email: String!, $password: String!) {
  artist_login(email: $email, password: $password) {
     artistToken
    artist {
       email
      _id
      fullName
      artistAka
      confirmed
  }
}
}
`


export const SELECT_PLAN = gql`

mutation selectPlan($artistId: ID!, $plan: String!) {
  selectPlan(artistId: $artistId, plan: $plan)
}
`