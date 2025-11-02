import logger from '@/logger';
import { chatService } from './chat-service';

const log = logger.child({ module: 'appInitializer' });

/**
 * Application initialization service
 * Handles startup tasks like connecting to chat service
 */
class AppInitializer {
  private isInitialized: boolean = false;

  /**
   * Initialize the application
   * Call this once on app startup
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      log.debug('Application already initialized');
      return;
    }

    try {
      log.info('Starting application initialization');

      // Initialize chat service with all user channels
      await chatService.initialize();

      this.isInitialized = true;
      log.info('Application initialization completed successfully');
    } catch (error) {
      log.error({ error }, 'Application initialization failed');
      throw error;
    }
  }

  /**
   * Shutdown the application
   */
  shutdown(): void {
    if (!this.isInitialized) {
      return;
    }

    log.info('Shutting down application');
    chatService.shutdown();
    this.isInitialized = false;
    log.info('Application shutdown completed');
  }

  /**
   * Check if application is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const appInitializer = new AppInitializer();
export default appInitializer;
