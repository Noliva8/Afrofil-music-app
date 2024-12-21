import React from "react";
import { Navigate } from "react-router-dom";
import artist_auth from "../utils/artist_auth"; 

const ArtistProtectedRoute = ({ element }) => {
  return artist_auth.isArtist() ? element : <Navigate to="/artist/register" />;
};

export default ArtistProtectedRoute;
