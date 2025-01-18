

// import './App.css';
import './entry.css';
import NavTabs from './components/NavTabs';
import ProfileDropdown from './components/ProfileDropdown';
import { Outlet } from 'react-router-dom';

import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
  
} from '@apollo/client';

import { setContext } from '@apollo/client/link/context';
import Auth from './utils/auth';

// Construct our main GraphQL API endpoint
const httpLink = createHttpLink({
  uri: '/graphql',
});



// Construct request middleware that will attach the JWT token to every request as an `authorization` header
const authLink = setContext((_, { headers }) => {
  // Retrieve the tokens from localStorage
  const userToken = localStorage.getItem('user_id_token');
  const artistToken = localStorage.getItem('artist_id_token');

  // Log the tokens for debugging purposes
  console.log('User Token:', userToken);  
  console.log('Artist Tokennnn:', artistToken);  

  // Check if both tokens are missing
  if (!userToken && !artistToken) {
    console.error('No tokens found in localStorage');
  }

  // Only send the available token in the authorization headers
  return {
    headers: {
      ...headers,
      authorization: artistToken ? `Bearer ${artistToken}` : "",
    }
  }
 
});


const client = new ApolloClient({
  // Set up our client to execute the `authLink` middleware prior to making the request to our GraphQL API
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});


function App() {
  const loggedIn = Auth.loggedIn();

  return (
    <ApolloProvider client={client}>
      {loggedIn && <NavTabs /> && <ProfileDropdown />} 
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
