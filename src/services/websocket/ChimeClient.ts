import logger from '@/logger';
import { ChimeMessage } from '@/types/Message';
import { ConnectionManager } from './ConnectionManager';
import { MessageHandler } from './MessageHandler';
import { MessageSender } from './MessageSender';
import { SubscriptionHandler } from './SubscriptionHandler';

const log = logger.child({ module: 'chimeClient' });

/**
 * Event handlers for the Chime client
 */
export interface ChimeClientEventHandlers {
  onChatMessage?: (message: ChimeMessage) => void;
  onConnected?: (channels: string[]) => void;
  onError?: (error: string, details?: string) => void;
  onDisconnected?: () => void;
  onChannelsUpdated?: (channels: string[]) => void;
}

/**
 * High-level Chime chat client that orchestrates the modular WebSocket components
 */
export class ChimeClient {
  private connectionManager!: ConnectionManager;
  private messageHandler!: MessageHandler;
  private messageSender!: MessageSender;
  private subscriptionHandler!: SubscriptionHandler;
  private eventHandlers: ChimeClientEventHandlers = {};

  constructor(private serverUrl: string) {
    this.setupComponents();
    log.debug({ serverUrl }, 'Chime client initialized');
  }

  /**
   * Set event handlers for the client
   */
  setEventHandlers(handlers: ChimeClientEventHandlers): void {
    this.eventHandlers = { ...handlers };
  }

  /**
   * Connect to the WebSocket server with initial channel subscriptions
   */
  async connect(userChannels: string[] = ['general']): Promise<void> {
    log.debug(
      {
        userChannels,
        channelCount: userChannels.length,
        serverUrl: this.serverUrl,
        isConnected: this.isConnected(),
      },
      'ChimeClient: Starting connection process'
    );

    if (this.isConnected()) {
      log.debug(
        {
          userChannels,
          currentChannels: this.getConfirmedChannels(),
        },
        'ChimeClient: Already connected, skipping connection'
      );
      return;
    }

    log.info(
      {
        serverUrl: this.serverUrl,
        userChannels,
        step: 'establishing_websocket',
      },
      'ChimeClient: Establishing WebSocket connection'
    );

    try {
      // First establish WebSocket connection
      log.debug(
        { serverUrl: this.serverUrl },
        'ChimeClient: Calling ConnectionManager.connect()'
      );
      await this.connectionManager.connect();

      log.info(
        {
          serverUrl: this.serverUrl,
          connectionState: this.connectionManager.getState(),
        },
        'ChimeClient: WebSocket connection established'
      );

      // Then send handshake with user's channels
      log.debug(
        {
          userChannels,
          step: 'sending_handshake',
        },
        'ChimeClient: Sending handshake message'
      );

      this.messageSender.sendHandshake(userChannels);

      log.info(
        {
          userChannels,
          channelCount: userChannels.length,
          success: true,
        },
        'ChimeClient: Connection initiated with handshake sent'
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Connection failed';
      log.error(
        {
          error,
          stack: error instanceof Error ? error.stack : undefined,
          serverUrl: this.serverUrl,
          userChannels,
          connectionState: this.connectionManager.getState(),
        },
        'ChimeClient: Failed to connect'
      );
      this.eventHandlers.onError?.(errorMsg);
      throw error;
    }
  }

  /**
   * Send a chat message to a channel
   */
  sendChatMessage(channelId: string, content: string): void {
    log.debug(
      {
        channelId,
        contentLength: content.length,
        isConnected: this.isConnected(),
        confirmedChannels: this.getConfirmedChannels(),
      },
      'ChimeClient: Attempting to send chat message'
    );

    if (!this.isConnected()) {
      const errorMsg = 'Cannot send message: ChimeClient not connected';
      log.error(
        {
          channelId,
          contentLength: content.length,
          isConnected: this.isConnected(),
          connectionState: this.connectionManager.getState(),
        },
        errorMsg
      );
      this.eventHandlers.onError?.(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      log.debug({ channelId }, 'ChimeClient: Delegating to MessageSender');
      this.messageSender.sendChatMessage(channelId, content);
      log.info(
        {
          channelId,
          contentLength: content.length,
          success: true,
        },
        'ChimeClient: Chat message sent successfully'
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to send message';
      log.error(
        {
          error,
          channelId,
          contentLength: content.length,
          stack: error instanceof Error ? error.stack : undefined,
        },
        'ChimeClient: Failed to send chat message'
      );
      this.eventHandlers.onError?.(errorMsg);
      throw error;
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.connectionManager.disconnect();
    this.subscriptionHandler.reset();
    log.info('Disconnected from server');
  }

  /**
   * Check if connected to server
   */
  isConnected(): boolean {
    return this.connectionManager.isConnected();
  }

  /**
   * Get channels confirmed by server
   */
  getConfirmedChannels(): string[] {
    return this.subscriptionHandler.getConfirmedChannels();
  }

  /**
   * Initialize all the modular components with proper dependency injection
   */
  private setupComponents(): void {
    // Create subscription handler first (no dependencies)
    this.subscriptionHandler = new SubscriptionHandler(channels => {
      this.eventHandlers.onChannelsUpdated?.(channels);
    });

    // Create message handler with event callbacks
    this.messageHandler = new MessageHandler(
      chatMessage => this.eventHandlers.onChatMessage?.(chatMessage),
      (userId, channels) => this.handleConnectionSuccess(userId, channels),
      (error, details) => this.eventHandlers.onError?.(error, details)
    );

    // Create connection manager with message routing
    this.connectionManager = new ConnectionManager(
      this.serverUrl,
      rawData => this.messageHandler.handleMessage(rawData),
      () => log.debug('WebSocket connection opened'),
      () => this.handleDisconnection(),
      error => this.eventHandlers.onError?.(error)
    );

    // Create message sender with dependencies
    this.messageSender = new MessageSender(
      this.connectionManager,
      this.subscriptionHandler
    );
  }

  /**
   * Handle successful connection response from server
   */
  private handleConnectionSuccess(userId: string, channels: string[]): void {
    log.info({ userId, channels }, 'Connection handshake completed');

    // Let subscription handler validate and store channels
    this.subscriptionHandler.handleChannelConfirmation([], channels);

    // Notify application of successful connection
    this.eventHandlers.onConnected?.(channels);
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(): void {
    this.subscriptionHandler.reset();
    this.eventHandlers.onDisconnected?.();
    log.info('Disconnected and reset state');
  }
}
