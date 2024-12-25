// Import necessary packages and functions
import connectDB from './config/connection.js'; 
import { expressMiddleware } from '@apollo/server/express4';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import path from 'path';
import dotenv from 'dotenv';
import { artist_typeDefs, artist_resolvers } from './schemas/Artist_schema/index.js';
import { user_typeDefs, user_resolvers } from './schemas/User_schema/index.js';
import { user_authMiddleware } from './utils/user_auth.js';
import { artist_authMiddleware } from './utils/artist_auth.js';
import merge from 'lodash.merge';
// import cors from 'cors';
import jwt from 'jsonwebtoken';
import Artist from './models/Artist/Artist.js';



// Initialize dotenv for environment variables
dotenv.config();

// Set up port and express app
const PORT = process.env.PORT || 3001;
const app = express();

// File upload middleware for handling file uploads with GraphQL
app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));


// combining typeDefs and resolvers
// ------------------------------

const typeDefs =[ artist_typeDefs, user_typeDefs];
const resolvers = merge( artist_resolvers, user_resolvers );


// Set up Apollo Server with GraphQL schema
const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: false,
});

// Start the Apollo Server and connect to the DB
const startApolloServer = async () => {
  try {
    // Start Apollo Server
    console.log('Apollo Server starting...');
    await server.start();
    console.log('Apollo Server started successfully');

    // Use Express middleware
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());

      // authentication middleware
    // -----------------------------------------

   const combinedAuthMiddleware = (req) => {
  const userContext = user_authMiddleware(req);
  const artistContext = artist_authMiddleware(req);
  
  return {
    ...userContext,
    ...artistContext,
  };
};

app.use('/graphql', expressMiddleware(server, {
  context: combinedAuthMiddleware
}));

// app.use(cors({
//   origin: 'http://localhost:3000', 
//   credentials: true,            
// }));



// email  verfication
// -----------------
app.get('/confirmation/:artist_id_token', async (req, res) => {
  try {
    // Decode the token
    const decoded = jwt.verify(req.params.artist_id_token, process.env.JWT_SECRET_ARTIST);

    // Debugging: Log the decoded token
    console.log(decoded);

    // Check if the token contains the required structure
    if (!decoded || !decoded.data || !decoded.data._id) {
      throw new Error('Invalid token structure');
    }

    // Extract the artist ID
    const { _id } = decoded.data;

    // Update the artist's confirmation status
    const artist = await Artist.findByIdAndUpdate(_id, { confirmed: true });

  } catch (e) {
    console.log('Error confirming email:', e);
    res.status(400).json({ success: false, message: 'Error during verification' });
  }

  return res.redirect('http://localhost:3000/artist/login');
});


// -------------------------------------------------------------
    // Production setup: Serve static files if in production mode
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../client/dist')));
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
      });
    }

    // Attempt to connect to the database
    console.log('Attempting to connect to the database...');
    await connectDB();  // Call connectDB function to connect to MongoDB

    // Start the server only after DB is connected
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}!`);
      console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
    });

  } catch (error) {
    console.error('Error starting Apollo Server:', error);
  }
};

// Call the function to start the Apollo Server
startApolloServer();
