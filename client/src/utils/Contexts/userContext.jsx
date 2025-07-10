import { createContext, useContext, useState, useEffect } from 'react';
import UserAuth from '../auth.js';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Safe role normalization - only falls back if role is missing/undefined
  const normalizeUser = (userData) => {
    if (!userData) return null;
    
    // Explicit check for undefined or missing role property
    const role = Object.hasOwnProperty.call(userData, 'role') 
      ? userData.role?.toLowerCase() 
      : 'user'; // Fallback ONLY if role property doesn't exist
    
    return {
      ...userData,
      role 
    };
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (UserAuth.loggedIn()) {
          const profile = UserAuth.getProfile();
          setUser(normalizeUser(profile?.data));
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = (userData) => {
    const normalizedUser = normalizeUser(userData);
    setUser(normalizedUser);
    return normalizedUser;
  };

  const logout = () => {
    UserAuth.logout();
    setUser(null);
  };

  // Auth state with explicit role handling
  const authState = {
    user,
    loading,
    isGuest: !user && !loading,
    
    // Role checks (will respect null/empty roles if explicitly set)
    isUser: user?.role === 'user',
    isPremium: user?.role === 'premium',
    isAdmin: user?.role === 'admin',
    
    // Flexible role check that handles all cases
    hasRole: (role) => user?.role === role,
    
    // Auth methods
    login,
    logout
  };





  return (
    <UserContext.Provider value={authState}>
      {!loading && children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};