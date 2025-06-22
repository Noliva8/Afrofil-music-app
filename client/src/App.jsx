import './entry.css';
import NavTabs from './components/NavTabs';
import ProfileDropdown from './components/ProfileDropdown';
import { Outlet } from 'react-router-dom';

import { ApolloClient, InMemoryCache, ApolloProvider, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { setContext } from '@apollo/client/link/context';
import Auth from './utils/auth';





// HTTP link for queries and mutations
const httpLink = createUploadLink({
  uri: '/graphql', 
});




// Set up middleware to attach the JWT token to every request
const authLink = setContext((_, { headers }) => {
  const userToken = localStorage.getItem('user_id_token');
  const artistToken = localStorage.getItem('artist_id_token');

  // Log tokens for debugging
  // console.log('User Token:', userToken);  
  // console.log('Artist Token:', artistToken);  

  // Only send the available token in the authorization headers
  return {
    headers: {
      ...headers,
      authorization: artistToken ? `Bearer ${artistToken}` : userToken ? `Bearer ${userToken}` : "",
    },
  };
});



const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:3001/graphql',
    connectionParams: async () => {
      const artistToken = localStorage.getItem('artist_id_token');
      const userToken = localStorage.getItem('user_id_token');
      
      if (!artistToken && !userToken) {
        throw new Error('No authentication token found');
      }

      return {
        authorization: artistToken 
          ? `Bearer ${artistToken}`
          : `Bearer ${userToken}`
      };
    },
    connectionAckWaitTimeout: 10000, // 10 seconds
    shouldRetry: (err) => {
      // Don't retry on auth errors
      return !err.message.includes('Authentication failed');
    },
    on: {
      connected: () => console.log('WebSocket connected'),
      error: (err) => console.error('WebSocket error:', err)
    }
  })
);




// Combine Links Using split

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);



// Initialize Apollo Client
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});





function App() {
  const loggedIn = Auth.loggedIn(); 

  return (
    <ApolloProvider client={client}>
      {loggedIn && (
        <>
          <NavTabs />
          <ProfileDropdown />
        </>
      )}
      <div>
        <Outlet /> {/* Render the child routes */}
      </div>
    </ApolloProvider>
  );
}

export default App;
























// ---------------------------------------------------------------------------
// // import './App.css';
// import './entry.css';
// import NavTabs from './components/NavTabs';
// import { Outlet } from 'react-router-dom';
// // import ProfileDropdown from './components/ProfileDropdown';
// import Auth from './utils/auth'; // Import Auth for authentication checks
// import artist_auth from './utils/artist_auth';

// function App() {
//   const loggedIn = Auth.loggedIn(); // Check if a user is logged in
//   const artistLoggedIn = artist_auth.isArtist(); 

//   return (

// <div className="entry">
//   <div>
//   <NavTabs />
//      <Outlet />
     
//   </div>
// </div>




//     // <div className="entry">
//     //   {artistLoggedIn ? (
//     //     <div>
//     //       <Outlet />
//     //     </div>
//     //   ) : loggedIn ? (
//     //     <div>
//     //       {/* <ProfileDropdown /> */}
//     //       <Outlet />
//     //       <NavTabs />
//     //     </div>
//     //   ) : (
//     //     <Outlet />
//     //   )}
//     // </div>
//   );
// }

// export default App;
