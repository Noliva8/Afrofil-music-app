import { gql } from '@apollo/client';


export const SONG_UPLOAD_UPDATE = gql`
subscription songUploadProgress {
  songUploadProgress {
    isComplete
    message
    percent
    status
    step
  }
}
`

