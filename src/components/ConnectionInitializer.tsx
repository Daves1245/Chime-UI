'use client';

import { useEffect, useState } from 'react';
import { initializeConnection } from '@/init/connection-init';
import logger from '@/logger';

const log = logger.child({ module: 'connectionInitializer' });

export function ConnectionInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        log.info('Initializing global connection...');
        await initializeConnection();

        if (mounted) {
          setIsInitialized(true);
          log.info('Global connection initialized successfully');
        }
      } catch (err) {
        if (mounted) {
          const errorMsg =
            err instanceof Error
              ? err.message
              : 'Connection initialization failed';
          log.error({ error: err }, errorMsg);
          setError(errorMsg);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            Connection Error
          </h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing connection...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
