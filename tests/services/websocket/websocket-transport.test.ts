import {
  WebSocketTransport,
  ConnectionState,
  WebSocketTransportHandlers,
} from '../../../src/services/websocket/websocket-transport';

// Mock the logger
jest.mock('@/logger', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      child: jest.fn().mockReturnThis(),
    }),
  };
  return {
    __esModule: true,
    default: mockLogger,
  };
});

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public readyState = MockWebSocket.CONNECTING;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    // Simulate async connection
    setTimeout(() => {
      if (this.readyState === MockWebSocket.CONNECTING && this.onopen) {
        this.readyState = MockWebSocket.OPEN;
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  // Test helper methods
  simulateMessage(data: string): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }

  simulateError(): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  simulateClose(): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// Replace global WebSocket
(global as any).WebSocket = MockWebSocket;

describe('WebSocketTransport', () => {
  let transport: WebSocketTransport;
  let mockHandlers: jest.Mocked<WebSocketTransportHandlers>;
  const testUrl = 'ws://localhost:8080/test';

  beforeEach(() => {
    mockHandlers = {
      onMessage: jest.fn(),
      onOpen: jest.fn(),
      onClose: jest.fn(),
      onError: jest.fn(),
    };

    transport = new WebSocketTransport(testUrl, mockHandlers);
  });

  afterEach(() => {
    transport.disconnect();
  });

  describe('initialization', () => {
    it('should initialize with disconnected state', () => {
      expect(transport.getState()).toBe(ConnectionState.DISCONNECTED);
      expect(transport.isConnected()).toBe(false);
    });
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      await transport.connect();

      expect(transport.getState()).toBe(ConnectionState.CONNECTED);
      expect(transport.isConnected()).toBe(true);
      expect(mockHandlers.onOpen).toHaveBeenCalled();
    });

    it('should not connect if already connected', async () => {
      await transport.connect();

      // Second connect should return immediately
      await transport.connect();

      expect(mockHandlers.onOpen).toHaveBeenCalledTimes(1);
    });

    it('should reject if connection is already in progress', async () => {
      const firstConnect = transport.connect();

      await expect(transport.connect()).rejects.toThrow(
        'Connection already in progress'
      );

      await firstConnect; // Clean up
    });

    it('should handle connection errors during creation', async () => {
      // Mock WebSocket constructor to throw
      const originalWebSocket = (global as any).WebSocket;
      (global as any).WebSocket = jest.fn().mockImplementation(() => {
        throw new Error('Network error');
      });

      await expect(transport.connect()).rejects.toThrow(
        'Failed to create WebSocket: Error: Network error'
      );
      expect(transport.getState()).toBe(ConnectionState.ERROR);

      // Restore
      (global as any).WebSocket = originalWebSocket;
    });
  });

  describe('send', () => {
    beforeEach(async () => {
      await transport.connect();
    });

    it('should send data when connected', () => {
      const testData = 'test message';

      expect(() => transport.send(testData)).not.toThrow();
    });

    it('should throw error when not connected', () => {
      transport.disconnect();

      expect(() => transport.send('test')).toThrow(
        'Not connected to WebSocket server'
      );
    });

    it('should handle send errors', () => {
      // Mock the WebSocket send to throw
      const ws = (transport as any).ws;
      ws.send = jest.fn().mockImplementation(() => {
        throw new Error('Send failed');
      });

      expect(() => transport.send('test')).toThrow(
        'Failed to send data: Error: Send failed'
      );
    });
  });

  describe('message handling', () => {
    beforeEach(async () => {
      await transport.connect();
    });

    it('should handle incoming messages', () => {
      const testData = 'test message';
      const ws = (transport as any).ws as MockWebSocket;

      ws.simulateMessage(testData);

      expect(mockHandlers.onMessage).toHaveBeenCalledWith(testData);
    });

    it('should handle multiple messages', () => {
      const messages = ['message1', 'message2', 'message3'];
      const ws = (transport as any).ws as MockWebSocket;

      messages.forEach(msg => ws.simulateMessage(msg));

      expect(mockHandlers.onMessage).toHaveBeenCalledTimes(3);
      messages.forEach((msg, index) => {
        expect(mockHandlers.onMessage).toHaveBeenNthCalledWith(index + 1, msg);
      });
    });
  });

  describe('error handling', () => {
    it('should handle connection errors during handshake', async () => {
      const connectPromise = transport.connect();

      // Simulate error during connection
      const ws = (transport as any).ws as MockWebSocket;
      // Ensure ws is connecting before simulating error
      await new Promise(resolve => setTimeout(resolve, 5));
      ws.simulateError();

      await expect(connectPromise).rejects.toThrow(
        'WebSocket connection error'
      );
      expect(transport.getState()).toBe(ConnectionState.ERROR);
      expect(mockHandlers.onError).toHaveBeenCalled();
    });

    it('should handle errors after connection established', async () => {
      await transport.connect();

      const ws = (transport as any).ws as MockWebSocket;
      ws.simulateError();

      expect(mockHandlers.onError).toHaveBeenCalled();
      expect(transport.getState()).toBe(ConnectionState.ERROR);
    });
  });

  describe('disconnect', () => {
    it('should disconnect when connected', async () => {
      await transport.connect();

      transport.disconnect();

      expect(transport.getState()).toBe(ConnectionState.DISCONNECTED);
      expect(transport.isConnected()).toBe(false);
    });

    it('should handle disconnect when not connected', () => {
      expect(() => transport.disconnect()).not.toThrow();
      expect(transport.getState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('should call onClose handler when connection closes', async () => {
      await transport.connect();

      const ws = (transport as any).ws as MockWebSocket;
      ws.simulateClose();

      expect(mockHandlers.onClose).toHaveBeenCalled();
      expect(transport.getState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('should handle close during connection attempt', async () => {
      const connectPromise = transport.connect();

      // Simulate close during handshake
      const ws = (transport as any).ws as MockWebSocket;
      // Ensure ws is connecting before simulating close
      await new Promise(resolve => setTimeout(resolve, 5));
      ws.simulateClose();

      await expect(connectPromise).rejects.toThrow(
        'WebSocket connection closed during handshake'
      );
    });
  });

  describe('state management', () => {
    it('should transition states correctly during connection lifecycle', async () => {
      expect(transport.getState()).toBe(ConnectionState.DISCONNECTED);

      const connectPromise = transport.connect();
      expect(transport.getState()).toBe(ConnectionState.CONNECTING);

      await connectPromise;
      expect(transport.getState()).toBe(ConnectionState.CONNECTED);

      transport.disconnect();
      expect(transport.getState()).toBe(ConnectionState.DISCONNECTED);
    });
  });
});
