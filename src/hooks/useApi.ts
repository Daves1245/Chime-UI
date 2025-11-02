import { useState, useEffect, useCallback } from 'react';
import { ApiResponse } from '../services/api-service';

export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: readonly unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memoizedApiCall = useCallback(apiCall, [apiCall]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await memoizedApiCall();

        if (isMounted) {
          if (response.data) {
            setData(response.data);
          } else if (response.error) {
            setError(response.error);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [memoizedApiCall, dependencies]);

  const refetch = () => {
    setLoading(true);
    setError(null);

    memoizedApiCall()
      .then(response => {
        if (response.data) {
          setData(response.data);
        } else if (response.error) {
          setError(response.error);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      });
  };

  return { data, loading, error, refetch };
}
