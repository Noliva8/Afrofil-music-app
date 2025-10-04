// hooks/useGeoLocation.js
import { useState, useEffect } from 'react';
import { requestGeoPermission, getComprehensiveGeo } from '../geoClient.js';




export const useGeoLocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('unknown');

  useEffect(() => {
    let mounted = true;

    const fetchLocation = async () => {
      try {
        setLoading(true);
        
        // Check permission first
        const permissionStatus = await requestGeoPermission();
        setPermission(permissionStatus);

        if (permissionStatus === 'denied') {
          throw new Error('Location permission denied');
        }

        if (permissionStatus === 'unsupported') {
          throw new Error('Geolocation not supported');
        }

        // Get location
        const geoData = await getComprehensiveGeo(options);
        
        if (mounted) {
          setLocation(geoData);
          setError(null);
        }

      } catch (err) {
        if (mounted) {
          setError(err.message);
          setLocation(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchLocation();

    return () => {
      mounted = false;
    };
  }, [options]);

  return { location, loading, error, permission };
};