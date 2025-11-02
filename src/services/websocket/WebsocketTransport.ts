import logger from '@/logger';

const log = logger.child({ module: 'websocketTransport' });

/**
 * WebSocket connection states
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * Event handlers for WebSocket transport layer
 */
export interface WebSocketTransportHandlers {
  onMessage: (data: string) => void;
  onOpen: () => void;
  onClose: () => void;
  onError: (error: string) => void;
}

/**
 * Low-level WebSocket transport layer - handles only raw WebSocket operations
 */
export class WebSocketTransport {
  private ws: WebSocket | null = null;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private handlers: WebSocketTransportHandlers;

  constructor(
    private url: string,
    handlers: WebSocketTransportHandlers
  ) {
    this.handlers = handlers;
    log.debug({ url }, 'WebSocket transport initialized');
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.state === ConnectionState.CONNECTED) {
      log.debug('Already connected');
      return;
    }

    if (this.state === ConnectionState.CONNECTING) {
      throw new Error('Connection already in progress');
    }

    this.state = ConnectionState.CONNECTING;
    log.info({ url: this.url }, 'Connecting to WebSocket');

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        this.setupEventHandlers(resolve, reject);
      } catch (error) {
        this.state = ConnectionState.ERROR;
        const errorMsg = `Failed to create WebSocket: ${error}`;
        log.error({ error }, errorMsg);
        reject(new Error(errorMsg));
      }
    });
  }

  /**
   * Send raw string data
   */
  send(data: string): void {
    if (this.state !== ConnectionState.CONNECTED || !this.ws) {
      throw new Error('Not connected to WebSocket server');
    }

    try {
      this.ws.send(data);
      log.debug({ dataLength: data.length }, 'Data sent');
    } catch (error) {
      log.error({ error }, 'Failed to send data');
      throw new Error(`Failed to send data: ${error}`);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }

    this.cleanup();
    log.info('Disconnected from WebSocket');
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return (
      this.state === ConnectionState.CONNECTED &&
      this.ws?.readyState === WebSocket.OPEN
    );
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.state = ConnectionState.CONNECTED;
      log.debug('WebSocket connection opened');
      this.handlers.onOpen();
      resolve();
    };

    this.ws.onmessage = event => {
      log.debug({ dataLength: event.data.length }, 'Data received');
      this.handlers.onMessage(event.data);
    };

    this.ws.onclose = () => {
      const wasConnected = this.state === ConnectionState.CONNECTED;
      const wasConnecting = this.state === ConnectionState.CONNECTING;
      this.cleanup();

      if (wasConnected) {
        log.info('WebSocket connection closed');
        this.handlers.onClose();
      }

      if (wasConnecting) {
        reject(new Error('WebSocket connection closed during handshake'));
      }
    };

    this.ws.onerror = error => {
      const wasConnecting = this.state === ConnectionState.CONNECTING;
      this.state = ConnectionState.ERROR;
      const errorMsg = 'WebSocket connection error';
      log.error({ error }, errorMsg);
      this.handlers.onError(errorMsg);

      if (wasConnecting) {
        reject(new Error(errorMsg));
      }
    };
  }

  /**
   * Clean up connection state
   */
  private cleanup(): void {
    this.state = ConnectionState.DISCONNECTED;
    this.ws = null;
  }
}
