

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
import Auth from './utils/auth'; // Import Auth for authentication checks

// Construct our main GraphQL API endpoint
const httpLink = createHttpLink({
  uri: '/graphql',
});

// Construct request middleware that will attach the JWT token to every request as an `authorization` header
const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = localStorage.getItem('id_token');
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
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
