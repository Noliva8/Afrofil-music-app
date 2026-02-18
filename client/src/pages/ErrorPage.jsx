// import { useRouteError } from "react-router-dom";

// export default function ErrorPage() {
//   const error = useRouteError();
//   console.error(error);

//   return (
//     <div id="error-page">
//       <h1>Oops!</h1>
//       <p>Sorry, an unexpected error has occurred.</p>
//       <p>
//         <i>{error.statusText || error.message}</i>
//       </p>
//     </div>
//   );
// }



// ErrorPage.jsx
import { useRouteError } from "react-router-dom";
import { useEffect } from "react";

export default function ErrorPage() {

  
  const error = useRouteError();

  useEffect(() => {
    if (error) {
      console.error("Error caught by ErrorPage:", error);
    }
  }, [error]);

  if (!error) {
    return (
      <div id="error-page">
        <h1>Oops!</h1>
        <p>Sorry, an unexpected error has occurred.</p>
        <p>
          <i>Loading error details...</i>
        </p>
      </div>
    );
  }

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{error.statusText || error.message || "Unknown error"}</i>
      </p>
    </div>
  );
}











// import { useRouteError, isRouteErrorResponse } from "react-router-dom";

// export default function ErrorPage() {
//   const error = useRouteError();
  
//   console.error("Route Error:", error);

//   // Handle different types of errors
//   let errorMessage = "An unexpected error occurred";
//   let statusCode = null;

//   if (isRouteErrorResponse(error)) {
//     // Error from React Router (404, 500, etc.)
//     statusCode = error.status;
//     errorMessage = error.statusText || error.data?.message || `Error ${error.status}`;
//   } else if (error instanceof Error) {
//     // JavaScript Error object
//     errorMessage = error.message;
//   } else if (typeof error === 'string') {
//     // String error
//     errorMessage = error;
//   } else if (error && typeof error === 'object') {
//     // Generic object error
//     errorMessage = error.message || JSON.stringify(error);
//   }

//   return (
//     <div id="error-page" style={styles.container}>
//       <h1 style={styles.title}>🚨 Error</h1>
      
//       <div style={styles.errorBox}>
//         <p style={styles.errorMessage}>
//           <strong>Message:</strong> {errorMessage}
//         </p>
        
//         {statusCode && (
//           <p style={styles.statusCode}>
//             <strong>Status Code:</strong> {statusCode}
//           </p>
//         )}
        
//         {error?.stack && process.env.NODE_ENV === 'development' && (
//           <details style={styles.stackDetails}>
//             <summary>Stack Trace (Development Only)</summary>
//             <pre style={styles.stackTrace}>
//               {error.stack}
//             </pre>
//           </details>
//         )}
//       </div>
      
//       <div style={styles.actions}>
//         <button 
//           onClick={() => window.location.href = '/'}
//           style={styles.button}
//         >
//           Go Home
//         </button>
        
//         <button 
//           onClick={() => window.location.reload()}
//           style={{...styles.button, backgroundColor: '#333'}}
//         >
//           Refresh Page
//         </button>
//       </div>
//     </div>
//   );
// }

// const styles = {
//   container: {
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//     justifyContent: 'center',
//     minHeight: '100vh',
//     padding: '20px',
//     textAlign: 'center',
//     backgroundColor: '#000',
//     color: '#fff',
//     fontFamily: 'Arial, sans-serif'
//   },
//   title: {
//     fontSize: '3rem',
//     marginBottom: '1rem',
//     color: '#f07f21'
//   },
//   errorBox: {
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     padding: '20px',
//     borderRadius: '10px',
//     marginBottom: '2rem',
//     maxWidth: '600px',
//     width: '100%'
//   },
//   errorMessage: {
//     fontSize: '1.1rem',
//     marginBottom: '1rem',
//     wordBreak: 'break-word'
//   },
//   statusCode: {
//     fontSize: '1rem',
//     color: '#aaa',
//     marginBottom: '1rem'
//   },
//   stackDetails: {
//     textAlign: 'left',
//     marginTop: '1rem',
//     cursor: 'pointer'
//   },
//   stackTrace: {
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     padding: '10px',
//     borderRadius: '5px',
//     overflow: 'auto',
//     fontSize: '0.9rem',
//     maxHeight: '200px'
//   },
//   actions: {
//     display: 'flex',
//     gap: '10px',
//     flexWrap: 'wrap',
//     justifyContent: 'center'
//   },
//   button: {
//     padding: '10px 20px',
//     backgroundColor: '#f07f21',
//     color: 'white',
//     border: 'none',
//     borderRadius: '5px',
//     cursor: 'pointer',
//     fontSize: '1rem',
//     transition: 'background-color 0.3s'
//   }
// };
