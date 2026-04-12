import { useState, useEffect } from 'react';

// New Delhi fallback if GPS denied
const FALLBACK = { lat: 28.6139, lng: 77.209 };

export const useGeolocation = () => {
  const [location, setLocation] = useState({ ...FALLBACK });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLocation({ ...FALLBACK });
        setLoading(false);
      }
    );
  }, []);

  return { ...location, loading, error };
};