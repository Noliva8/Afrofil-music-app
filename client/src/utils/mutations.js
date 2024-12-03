import { gql } from '@apollo/client';

export const CREATE_USER = gql`
mutation CreateUser($username: String!, $email: String!, $password: String!) {
  createUser(username: $username, email: $email, password: $password) {
    token
    user {
      username
      email
      createdAt
      _id
    }
  }
}
`;

export const LOGIN_USER = gql`
  mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
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