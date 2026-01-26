import { useState, useEffect } from 'react';
import EncryptedStorage from 'react-native-encrypted-storage';

export const useAuthToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    EncryptedStorage.getItem('authToken')
      .then(setToken)
      .finally(() => setLoading(false));
  }, []);

  return { token, loading };
};
