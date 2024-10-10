const typeDefs = `

type User {
  _id: ID!
  username: String!
  email: String!
  likedSongs: [Song]
  playlists: [Playlist]
  searchHistory: [Song]
  playCounts: [PlaycountSchema]
  downloads: [DownloadSchema]
  recommendedSongs: [RecommendedSongsSchema]
  createdAt: String!
}

type PlaycountSchema {
  song: Song
  count: Int
}

type DownloadSchema {  
  song: Song
  downloadedAt: String!
}

type RecommendedSongsSchema {
  song: Song 
  algorithm: String
}



type Song {
  _id: ID!
  title: String!
  artist: Artist
  album: Album
  genre: String!
  duration: Int!
  playCount: Int!
  releaseDate: String! 
  downloadCount: Int!
  likedByUsers: [User]
  trendingScore: Int!
  tags: [String!]
  recommendedFor: [Recommendation!]
  audioFilePath: String!
  createdAt: String!
}

type Recommendation {
   user: User!
  algorithm: String!
}


type Album {
  title: String!
  artist: String!
  releaseDate: String!
  songs: [Song]
   genre: String!
   coverImage: String!
   createdAt: String!
}

type Artist {
  name: String!
  bio: String
  songs: [Song] 
  albums: [Album] 
  createdAt: String!
}

type Genre {
  name: String!,
  description: String!,
  songs: [Song]
  createdAt: String!,
}


type Playlist {
  title: String! 
  description: String!
   songs: [Song]
    createdBy: User
    createdAt: String!

}

type Favorite {
   user: User
   songs: [Song]
   albums: [Album]
   playlists:[Playlist]
    createdAt: String!
}






    type Query {
    users: [User]
    songs: [Song]
    albums: [Album]
    artists: [Artist]
    gernes: [Genre]
    playlists: [Playlist]

  }



  type Mutation {
    createMatchup(tech1: String!, tech2: String!): Matchup
    createVote(_id: String!, techNum: Int!): Matchup
  }
`;

module.exports = typeDefs;
