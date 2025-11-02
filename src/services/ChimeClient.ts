import logger from '@/logger';
import {
  Message,
  ChimeMessage,
  parseMessage,
  validateMessage,
} from '@/types/Message';
import {
  WebSocketTransport,
  ConnectionState,
  WebSocketTransportHandlers,
} from './websocket/WebsocketTransport';

const log = logger.child({ module: 'chimeClient' });

/**
 * Connection status information
 */
export interface ConnectionStatus {
  state: ConnectionState;
  isConnected: boolean;
  confirmedChannels: string[];
}

/**
 * Event handlers for Chime client
 */
export interface ChimeClientHandlers {
  onChatMessage?: (message: ChimeMessage) => void;
  onConnected?: (channels: string[]) => void;
  onError?: (error: string, details?: string) => void;
  onDisconnected?: () => void;
}

/**
 * Chime WebSocket client - handles Message protocol over WebSocket transport
 */
export default class ChimeClient {
  private transport: WebSocketTransport;
  private handlers: ChimeClientHandlers = {};
  private confirmedChannels: string[] = [];
  private isHandshakeComplete: boolean = false;

  constructor(serverUrl: string) {
    const transportHandlers: WebSocketTransportHandlers = {
      onMessage: data => this.handleRawMessage(data),
      onOpen: () => log.debug('Transport connection opened'),
      onClose: () => this.handleDisconnection(),
      onError: error => this.handlers.onError?.(error),
    };

    this.transport = new WebSocketTransport(serverUrl, transportHandlers);
    log.debug({ serverUrl }, 'Chime client initialized');
  }

  /**
   * Set event handlers
   */
  setHandlers(handlers: ChimeClientHandlers): void {
    this.handlers = { ...handlers };
  }

  /**
   * Connect and perform handshake with user's channels
   */
  async connect(userChannels: string[] = ['general']): Promise<void> {
    try {
      // Connect transport layer
      await this.transport.connect();

      // Send handshake
      this.sendHandshake(userChannels);

      log.info({ userChannels }, 'Connection initiated, handshake sent');
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Connection failed';
      log.error({ error }, 'Failed to connect');
      this.handlers.onError?.(errorMsg);
      throw error;
    }
  }

  /**
   * Send a chat message
   */
  sendChatMessage(channelId: string, content: string): void {
    if (!this.isConnected()) {
      throw new Error('Not connected to server');
    }

    const message: Message = {
      type: 'message',
      message: {
        channelId,
        messageId: '', // Server will assign
        userId: '', // Server will assign based on auth
        content,
        createdAt: new Date().toISOString(),
        editedAt: null,
        metadata: {},
      },
    };

    this.sendMessage(message);
    log.info({ channelId, contentLength: content.length }, 'Chat message sent');
  }

  /**
   * Send a generic Message
   */
  sendMessage(message: Message): void {
    // Allow handshake messages when transport is connected but handshake isn't complete
    const canSend =
      message.type === 'connect'
        ? this.transport.isConnected()
        : this.isConnected();

    if (!canSend) {
      throw new Error('Not connected to server');
    }

    try {
      const data = JSON.stringify(message);
      this.transport.send(data);
      log.debug({ messageType: message.type }, 'Message sent');
    } catch (error) {
      const errorMsg = `Failed to send message: ${error}`;
      log.error({ error, messageType: message.type }, errorMsg);
      this.handlers.onError?.(errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.transport.disconnect();
    this.resetState();
  }

  /**
   * Check if connected and handshake complete
   */
  isConnected(): boolean {
    return this.transport.isConnected() && this.isHandshakeComplete;
  }

  /**
   * Get connection status information
   */
  getConnectionStatus(): ConnectionStatus {
    return {
      state: this.transport.getState(),
      isConnected: this.isConnected(),
      confirmedChannels: [...this.confirmedChannels],
    };
  }

  /**
   * Get confirmed channels
   */
  getChannels(): string[] {
    return [...this.confirmedChannels];
  }

  /**
   * Send handshake message
   */
  private sendHandshake(channels: string[]): void {
    const message: Message = {
      type: 'connect',
      config: { channels },
    };

    this.sendMessage(message);
    log.debug({ channels }, 'Handshake sent');
  }

  /**
   * Handle raw WebSocket message data
   */
  private handleRawMessage(data: string): void {
    try {
      const message = parseMessage(data);
      this.handleMessage(message);
    } catch (error) {
      const errorMsg = `Message parsing failed: ${error}`;
      log.error({ error, rawData: data }, errorMsg);
      this.handlers.onError?.(errorMsg);
    }
  }

  /**
   * Handle parsed Message objects
   */
  private handleMessage(message: Message): void {
    const validation = validateMessage(message);
    if (!validation.valid) {
      const errorMsg = `Invalid message: ${validation.errors.join(', ')}`;
      log.error({ message, errors: validation.errors }, errorMsg);
      this.handlers.onError?.(errorMsg);
      return;
    }

    log.debug({ messageType: message.type }, 'Processing message');

    switch (message.type) {
      case 'message':
        this.handleChatMessage(message);
        break;
      case 'connected':
        this.handleConnectionResponse(message);
        break;
      case 'error':
        this.handleErrorResponse(message);
        break;
      case 'connect':
        log.debug('Received connect message (client-to-server only)');
        break;
    }
  }

  /**
   * Handle incoming chat messages
   */
  private handleChatMessage(
    message: Extract<Message, { type: 'message' }>
  ): void {
    log.info(
      {
        channelId: message.message.channelId,
        userId: message.message.userId,
        messageId: message.message.messageId,
      },
      'Chat message received'
    );

    this.handlers.onChatMessage?.(message.message);
  }

  /**
   * Handle connection confirmation from server
   */
  private handleConnectionResponse(
    message: Extract<Message, { type: 'connected' }>
  ): void {
    this.confirmedChannels = [...message.channels];
    this.isHandshakeComplete = true;

    log.info(
      {
        userId: message.userId,
        channels: message.channels,
      },
      'Handshake completed, connection confirmed'
    );

    this.handlers.onConnected?.(message.channels);
  }

  /**
   * Handle error messages from server
   */
  private handleErrorResponse(
    message: Extract<Message, { type: 'error' }>
  ): void {
    log.error(
      {
        error: message.message,
        details: message.details,
      },
      'Server error received'
    );

    this.handlers.onError?.(message.message, message.details);
  }

  /**
   * Handle transport disconnection
   */
  private handleDisconnection(): void {
    this.resetState();
    this.handlers.onDisconnected?.();
    log.info('Disconnected from server');
  }

  /**
   * Reset client state
   */
  private resetState(): void {
    this.confirmedChannels = [];
    this.isHandshakeComplete = false;
  }
}

const client: ChimeClient | null = null;

export function getClient(): ChimeClient {
  if (!client) {
    // TODO dependency inject instead of tight coupling
    return new ChimeClient('ws://localhost:3143');
  } else {
    return client;
  }
}
