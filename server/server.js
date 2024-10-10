const express = require('express');

// import appollo server
// --------------------
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');

// import path
// -----------
const path = require('path');


// import typesDefs and resolvers from schemas
// -------------------------------------------
const { typeDefs, resolvers } = require('./schemas');

// connection
// -----------
const db = require('./config/connection');


// import routes
// -------------
const routes = require('./routes');

const PORT = process.env.PORT || 3001;
const app = express();

// define apollo server
// ----------------------
const server = new ApolloServer({
  typeDefs,
  resolvers,
});


// function to start apollo server
// -------------------------------

const startApolloServer = async () => {
  await server.start();
  
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use('/graphql', expressMiddleware(server));
  app.use(routes);

 
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
  } 
  
  db.once('open', () => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}!`);
      console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
    });
  });
};

db.once('open', () => {
  app.listen(PORT, () => console.log(`Now listening on localhost: ${PORT}`));
});


// starting apololo server
// ----------------------

startApolloServer();
