import logger from '@/logger';

const log = logger.child({ module: 'connectionManager' });

export interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  readyState: number | null;
}

/**
 * Manages WebSocket connection lifecycle - only connection, no message handling
 */
export class ConnectionManager {
  private ws: WebSocket | null = null;
  private state: ConnectionState = {
    connected: false,
    connecting: false,
    readyState: null,
  };
  private connectionPromise: Promise<void> | null = null;

  constructor(
    private serverUrl: string,
    private onMessage: (rawData: string) => void,
    private onOpen: () => void,
    private onClose: () => void,
    private onError: (error: string) => void
  ) {}

  async connect(): Promise<void> {
    if (this.state.connected) {
      log.debug('Already connected');
      return;
    }

    if (this.state.connecting && this.connectionPromise) {
      log.debug('Connection already in progress');
      return this.connectionPromise;
    }

    this.state.connecting = true;
    log.info(
      { serverUrl: this.serverUrl },
      'Establishing WebSocket connection'
    );

    this.connectionPromise = this.establishConnection();
    return this.connectionPromise;
  }

  private async establishConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);
        this.setupEventHandlers(resolve, reject);
      } catch (error) {
        this.resetConnectionState();
        log.error(
          { error, serverUrl: this.serverUrl },
          'Failed to create WebSocket connection'
        );
        reject(new Error(`Failed to create WebSocket connection: ${error}`));
      }
    });
  }

  private setupEventHandlers(
    resolve: () => void,
    reject: (reason: Error) => void
  ): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      log.debug('WebSocket connection opened');
      this.state.connected = true;
      this.state.connecting = false;
      this.state.readyState = this.ws?.readyState || null;
      this.connectionPromise = null;
      this.onOpen();
      resolve();
    };

    this.ws.onmessage = event => {
      this.onMessage(event.data);
    };

    this.ws.onclose = () => {
      log.info('WebSocket connection closed');
      this.handleDisconnection();
      if (this.state.connecting) {
        reject(new Error('WebSocket connection closed unexpectedly'));
      }
    };

    this.ws.onerror = error => {
      log.error({ error }, 'WebSocket connection error');
      this.onError('WebSocket connection failed');
      if (this.state.connecting) {
        reject(new Error('WebSocket connection failed'));
      }
    };
  }

  private handleDisconnection(): void {
    const wasConnected = this.state.connected;
    this.resetConnectionState();

    if (wasConnected) {
      log.info('Disconnected from WebSocket server');
      this.onClose();
    }
  }

  private resetConnectionState(): void {
    this.state.connected = false;
    this.state.connecting = false;
    this.state.readyState = null;
    this.connectionPromise = null;
  }

  send(data: string): void {
    const state = this.getState();
    log.debug(
      {
        dataLength: data.length,
        connectionState: state,
        isConnected: this.isConnected(),
        wsReadyState: this.ws?.readyState,
        data: data.substring(0, 200) + (data.length > 200 ? '...' : ''),
      },
      'Attempting to send data via WebSocket'
    );

    if (!this.isConnected()) {
      const error = `Not connected to server - state: ${JSON.stringify(state)}`;
      log.error(
        {
          connectionState: state,
          wsReadyState: this.ws?.readyState,
          dataLength: data.length,
        },
        error
      );
      throw new Error(error);
    }

    try {
      log.debug(
        {
          wsReadyState: this.ws?.readyState,
          dataLength: data.length,
        },
        'Sending data to WebSocket'
      );

      this.ws?.send(data);

      log.debug(
        {
          dataLength: data.length,
          success: true,
        },
        'Data successfully sent via WebSocket'
      );
    } catch (error) {
      log.error(
        {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          dataLength: data.length,
          wsReadyState: this.ws?.readyState,
        },
        'Failed to send data via WebSocket'
      );
      throw new Error(`Failed to send message to server: ${error}`);
    }
  }

  disconnect(): void {
    log.info(
      { wasConnected: this.state.connected },
      'Disconnecting WebSocket client'
    );

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }

    this.resetConnectionState();
    this.ws = null;
  }

  isConnected(): boolean {
    return this.state.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  getState(): Readonly<ConnectionState> {
    return { ...this.state };
  }
}
