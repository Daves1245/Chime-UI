import logger from '@/logger';
import ChimeChatClient, {
  ChimeClientHandlers,
  ConnectionStatus,
} from './ChimeClient';
import { ChimeMessage } from '@/types/Message';
import { apiService } from './api-service';

const log = logger.child({ module: 'chatService' });

/**
 * Chat service event handlers
 */
export interface ChatServiceHandlers {
  onMessage?: (message: ChimeMessage) => void;
  onConnectionStatusChanged?: (status: ConnectionStatus) => void;
  onError?: (error: string, details?: string) => void;
}

/**
 * Application-level chat service that manages WebSocket connection
 * Connects on startup with all user's channels
 */
export class ChatService {
  private client: ChimeChatClient | null = null;
  private handlers: ChatServiceHandlers = {};
  private isInitialized: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  /**
   * Initialize the chat service - call this on application startup
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      log.debug('Chat service already initialized');
      return;
    }

    try {
      log.info('Initializing chat service');

      // Get WebSocket configuration
      const wsUrl = await this.getWebSocketUrl();

      // Get all user's channels
      const userChannels = await this.getUserChannels();

      // Create and configure client
      this.client = new ChimeChatClient(wsUrl);
      this.setupClientHandlers();

      // Connect with all channels
      await this.client.connect(userChannels);

      this.isInitialized = true;
      this.reconnectAttempts = 0;

      log.info(
        {
          channelCount: userChannels.length,
          channels: userChannels,
        },
        'Chat service initialized successfully'
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Initialization failed';
      log.error({ error }, 'Failed to initialize chat service');
      this.handlers.onError?.(errorMsg);
      throw error;
    }
  }

  /**
   * Set event handlers for the service
   */
  setHandlers(handlers: ChatServiceHandlers): void {
    this.handlers = { ...handlers };
  }

  /**
   * Send a chat message
   */
  sendMessage(channelId: string, content: string): void {
    if (!this.client || !this.isInitialized) {
      throw new Error('Chat service not initialized');
    }

    try {
      this.client.sendChatMessage(channelId, content);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to send message';
      log.error({ error, channelId }, errorMsg);
      this.handlers.onError?.(errorMsg);
      throw error;
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus | null {
    return this.client?.getConnectionStatus() || null;
  }

  /**
   * Check if connected and ready
   */
  isConnected(): boolean {
    return this.client?.isConnected() || false;
  }

  /**
   * Get confirmed channels
   */
  getChannels(): string[] {
    return this.client?.getChannels() || [];
  }

  /**
   * Shutdown the chat service
   */
  shutdown(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.client?.disconnect();
    this.client = null;
    this.isInitialized = false;
    this.reconnectAttempts = 0;

    log.info('Chat service shutdown');
  }

  /**
   * Get WebSocket URL from configuration
   */
  private async getWebSocketUrl(): Promise<string> {
    try {
      const response = await fetch('/api/config');
      if (!response.ok) {
        throw new Error('Failed to fetch WebSocket configuration');
      }

      const config = await response.json();
      if (!config.websocket?.url) {
        throw new Error('WebSocket URL not found in configuration');
      }

      log.debug({ wsUrl: config.websocket.url }, 'Retrieved WebSocket URL');
      return config.websocket.url;
    } catch (error) {
      log.error({ error }, 'Failed to get WebSocket URL');
      // Fallback to default
      const fallbackUrl = 'ws://localhost:3141/ws';
      log.warn({ fallbackUrl }, 'Using fallback WebSocket URL');
      return fallbackUrl;
    }
  }

  /**
   * Gather all channels user is subscribed to across all servers
   */
  private async getUserChannels(): Promise<string[]> {
    try {
      log.debug('Gathering user channels from all servers');

      // Get all user's servers
      const serversResponse = await apiService.servers.getAllServers();
      if (serversResponse.error) {
        log.warn(
          { error: serversResponse.error },
          'Failed to fetch servers from API, using fallback'
        );
        return ['general']; // Fallback to general channel
      }

      const servers = serversResponse.data || [];
      const allChannels: string[] = [];

      // Collect channels from all servers
      for (const server of servers) {
        if (server.channels && Array.isArray(server.channels)) {
          allChannels.push(...server.channels);
        }

        // Also try to get channels from API if server has an ID
        if (server.id) {
          try {
            const channelsResponse =
              await apiService.channels.getChannelsByServer(server.id);
            if (channelsResponse.data) {
              const channelNames = channelsResponse.data.map(ch => ch.name);
              allChannels.push(...channelNames);
            }
          } catch (error) {
            log.warn(
              {
                serverId: server.id,
                error,
              },
              'Failed to fetch channels for server'
            );
          }
        }
      }

      // Remove duplicates and ensure we have at least one channel
      const uniqueChannels = [...new Set(allChannels)];
      const finalChannels =
        uniqueChannels.length > 0 ? uniqueChannels : ['general'];

      log.info(
        {
          serverCount: servers.length,
          totalChannels: finalChannels.length,
          channels: finalChannels,
        },
        'Collected user channels'
      );

      return finalChannels;
    } catch (error) {
      log.error({ error }, 'Failed to gather user channels');
      return ['general']; // Fallback
    }
  }

  /**
   * Setup WebSocket client event handlers
   */
  private setupClientHandlers(): void {
    if (!this.client) return;

    const clientHandlers: ChimeClientHandlers = {
      onChatMessage: message => {
        log.debug(
          {
            channelId: message.channelId,
            userId: message.userId,
          },
          'Chat message received'
        );
        this.handlers.onMessage?.(message);
      },

      onConnected: channels => {
        log.info({ channels }, 'Connected to chat server');
        this.reconnectAttempts = 0;
        this.notifyStatusChange();
      },

      onError: (error, details) => {
        log.error({ error, details }, 'Chat client error');
        this.handlers.onError?.(error, details);
        this.notifyStatusChange();

        // Attempt reconnection for connection errors
        if (error.includes('connection') || error.includes('Connection')) {
          this.attemptReconnection();
        }
      },

      onDisconnected: () => {
        log.warn('Disconnected from chat server');
        this.notifyStatusChange();
        this.attemptReconnection();
      },
    };

    this.client.setHandlers(clientHandlers);
  }

  /**
   * Notify handlers of connection status changes
   */
  private notifyStatusChange(): void {
    const status = this.getConnectionStatus();
    if (status) {
      this.handlers.onConnectionStatusChanged?.(status);
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      log.error(
        {
          attempts: this.reconnectAttempts,
        },
        'Max reconnection attempts reached'
      );
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    log.info(
      {
        attempt: this.reconnectAttempts,
        delay,
      },
      'Attempting reconnection'
    );

    this.reconnectTimeout = setTimeout(async () => {
      try {
        // Clean up existing client and reset state for reconnection
        this.client?.disconnect();
        this.client = null;
        this.isInitialized = false;

        await this.initialize();
      } catch (error) {
        log.error(
          { error, attempt: this.reconnectAttempts },
          'Reconnection failed'
        );
      }
    }, delay);
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;
