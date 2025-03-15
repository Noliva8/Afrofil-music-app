import './entry.css';
import NavTabs from './components/NavTabs';
import ProfileDropdown from './components/ProfileDropdown';
import { Outlet } from 'react-router-dom';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { setContext } from '@apollo/client/link/context';
import Auth from './utils/auth';


const httpLink = createUploadLink({
  uri: '/graphql', 
});

// Set up middleware to attach the JWT token to every request
const authLink = setContext((_, { headers }) => {
  const userToken = localStorage.getItem('user_id_token');
  const artistToken = localStorage.getItem('artist_id_token');

  // Log tokens for debugging
  console.log('User Token:', userToken);  
  console.log('Artist Token:', artistToken);  

  // Only send the available token in the authorization headers
  return {
    headers: {
      ...headers,
      authorization: artistToken ? `Bearer ${artistToken}` : userToken ? `Bearer ${userToken}` : "",
    },
  };
});

// Initialize Apollo Client
const client = new ApolloClient({
  link: authLink.concat(httpLink),
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
