import { globalConnectionManager } from '../services/GlobalConnectionManager';

let initPromise: Promise<void> | null = null;

export function initializeConnection(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = globalConnectionManager.initialize();
  return initPromise;
}

export function shutdownConnection(): Promise<void> {
  return globalConnectionManager.shutdown();
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    shutdownConnection();
  });
}
