import ChimeClient, {
  ChimeClientHandlers,
  ConnectionStatus,
} from '@/services/ChimeClient';
import {
  WebSocketTransport,
  ConnectionState,
} from '@/services/websocket/WebsocketTransport';
import { Message, ChimeMessage } from '@/types/Message';

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

// Mock WebSocketTransport
jest.mock('@/services/websocket/ChimeClient');

describe('ChimeClient', () => {
  let client: ChimeClient;
  let mockTransport: jest.Mocked<WebSocketTransport>;
  let mockHandlers: jest.Mocked<ChimeClientHandlers>;
  const testUrl = 'ws://localhost:3143';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock transport
    mockTransport = {
      connect: jest.fn(),
      send: jest.fn(),
      disconnect: jest.fn(),
      getState: jest.fn(),
      isConnected: jest.fn(),
    } as any;

    // Mock the WebSocketTransport constructor
    (
      WebSocketTransport as jest.MockedClass<typeof WebSocketTransport>
    ).mockImplementation(() => mockTransport);

    // Create mock handlers
    mockHandlers = {
      onChatMessage: jest.fn(),
      onConnected: jest.fn(),
      onError: jest.fn(),
      onDisconnected: jest.fn(),
    };

    client = new ChimeClient(testUrl);
    client.setHandlers(mockHandlers);
  });

  describe('initialization', () => {
    it('should create WebSocketTransport with correct URL', () => {
      expect(WebSocketTransport).toHaveBeenCalledWith(
        testUrl,
        expect.objectContaining({
          onMessage: expect.any(Function),
          onOpen: expect.any(Function),
          onClose: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    it('should start with disconnected state', () => {
      mockTransport.isConnected.mockReturnValue(false);
      mockTransport.getState.mockReturnValue(ConnectionState.DISCONNECTED);

      expect(client.isConnected()).toBe(false);
      expect(client.getChannels()).toEqual([]);
    });
  });

  describe('connect', () => {
    it('should connect transport and send handshake', async () => {
      const userChannels = ['general', 'random'];
      mockTransport.connect.mockResolvedValue();
      mockTransport.isConnected.mockReturnValue(true);

      await client.connect(userChannels);

      expect(mockTransport.connect).toHaveBeenCalled();
      expect(mockTransport.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'connect',
          config: { channels: userChannels },
        })
      );
    });

    it('should use default channels if none provided', async () => {
      mockTransport.connect.mockResolvedValue();
      mockTransport.isConnected.mockReturnValue(true);

      await client.connect();

      expect(mockTransport.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'connect',
          config: { channels: ['general'] },
        })
      );
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockTransport.connect.mockRejectedValue(error);

      await expect(client.connect()).rejects.toThrow('Connection failed');
      expect(mockHandlers.onError).toHaveBeenCalledWith('Connection failed');
    });
  });

  describe('message sending', () => {
    beforeEach(() => {
      mockTransport.isConnected.mockReturnValue(true);
      // Simulate handshake completion
      (client as any).isHandshakeComplete = true;
    });

    it('should send chat messages', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-01-01T12:00:00Z'));

      client.sendChatMessage('general', 'Hello world');

      expect(mockTransport.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'message',
          message: {
            channelId: 'general',
            messageId: '',
            userId: '',
            content: 'Hello world',
            createdAt: '2023-01-01T12:00:00.000Z',
            editedAt: null,
            metadata: {},
          },
        })
      );

      jest.useRealTimers();
    });

    it('should send generic messages', () => {
      const message: Message = {
        type: 'connect',
        config: { channels: ['test'] },
      };

      client.sendMessage(message);

      expect(mockTransport.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should throw error when not connected', () => {
      mockTransport.isConnected.mockReturnValue(false);

      expect(() => client.sendChatMessage('general', 'test')).toThrow(
        'Not connected to server'
      );
      expect(() =>
        client.sendMessage({ type: 'connect', config: { channels: [] } })
      ).toThrow('Not connected to server');
    });

    it('should handle send errors', () => {
      mockTransport.send.mockImplementation(() => {
        throw new Error('Send failed');
      });

      expect(() => client.sendChatMessage('general', 'test')).toThrow(
        'Failed to send message: Error: Send failed'
      );
      expect(mockHandlers.onError).toHaveBeenCalled();
    });
  });

  describe('message handling', () => {
    let transportHandlers: any;

    beforeEach(() => {
      // Extract transport handlers from constructor call
      const constructorCall = (
        WebSocketTransport as jest.MockedClass<typeof WebSocketTransport>
      ).mock.calls[0];
      transportHandlers = constructorCall[1];
    });

    it('should handle chat messages', () => {
      const chatMessage: Message = {
        type: 'message',
        message: {
          channelId: 'general',
          messageId: 'msg-123',
          userId: 'user-456',
          content: 'Hello!',
          createdAt: '2023-01-01T12:00:00Z',
          editedAt: null,
          metadata: {},
        },
      };

      transportHandlers.onMessage(JSON.stringify(chatMessage));

      expect(mockHandlers.onChatMessage).toHaveBeenCalledWith(
        chatMessage.message
      );
    });

    it('should handle connection confirmation', () => {
      mockTransport.isConnected.mockReturnValue(true);

      const connectedMessage: Message = {
        type: 'connected',
        userId: 'user-123',
        channels: ['general', 'random'],
      };

      transportHandlers.onMessage(JSON.stringify(connectedMessage));

      expect(client.getChannels()).toEqual(['general', 'random']);
      expect(client.isConnected()).toBe(true); // Handshake completed
      expect(mockHandlers.onConnected).toHaveBeenCalledWith([
        'general',
        'random',
      ]);
    });

    it('should handle error messages', () => {
      const errorMessage: Message = {
        type: 'error',
        message: 'Server error',
        details: 'Invalid channel',
      };

      transportHandlers.onMessage(JSON.stringify(errorMessage));

      expect(mockHandlers.onError).toHaveBeenCalledWith(
        'Server error',
        'Invalid channel'
      );
    });

    it('should handle invalid JSON', () => {
      transportHandlers.onMessage('invalid json');

      expect(mockHandlers.onError).toHaveBeenCalledWith(
        expect.stringContaining('Message parsing failed')
      );
    });

    it('should handle invalid message structure', () => {
      transportHandlers.onMessage(JSON.stringify({ invalid: 'message' }));

      expect(mockHandlers.onError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid message')
      );
    });

    it('should ignore connect messages (client-to-server only)', () => {
      const connectMessage: Message = {
        type: 'connect',
        config: { channels: ['test'] },
      };

      transportHandlers.onMessage(JSON.stringify(connectMessage));

      // Should not call any handlers
      expect(mockHandlers.onChatMessage).not.toHaveBeenCalled();
      expect(mockHandlers.onConnected).not.toHaveBeenCalled();
      expect(mockHandlers.onError).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should disconnect transport and reset state', () => {
      // Set up some state
      (client as any).confirmedChannels = ['general', 'random'];
      (client as any).isHandshakeComplete = true;
      mockTransport.isConnected.mockReturnValue(false);

      client.disconnect();

      expect(mockTransport.disconnect).toHaveBeenCalled();
      expect(client.getChannels()).toEqual([]);
      expect(client.isConnected()).toBe(false);
    });

    it('should handle transport disconnection', () => {
      const transportHandlers = (
        WebSocketTransport as jest.MockedClass<typeof WebSocketTransport>
      ).mock.calls[0][1];

      // Set up some state
      (client as any).confirmedChannels = ['general'];
      (client as any).isHandshakeComplete = true;

      transportHandlers.onClose();

      expect(client.getChannels()).toEqual([]);
      expect(mockHandlers.onDisconnected).toHaveBeenCalled();
    });
  });

  describe('status methods', () => {
    it('should return connection status', () => {
      mockTransport.getState.mockReturnValue(ConnectionState.CONNECTED);
      mockTransport.isConnected.mockReturnValue(true);
      (client as any).confirmedChannels = ['general', 'random'];
      (client as any).isHandshakeComplete = true;

      const status = client.getConnectionStatus();

      expect(status).toEqual({
        state: ConnectionState.CONNECTED,
        isConnected: true,
        confirmedChannels: ['general', 'random'],
      });
    });

    it('should return channels as immutable copy', () => {
      (client as any).confirmedChannels = ['general', 'random'];

      const channels1 = client.getChannels();
      const channels2 = client.getChannels();

      channels1.push('modified');

      expect(channels2).toEqual(['general', 'random']);
      expect(client.getChannels()).toEqual(['general', 'random']);
    });

    it('should require both transport connection and handshake completion', () => {
      // Only transport connected
      mockTransport.isConnected.mockReturnValue(true);
      (client as any).isHandshakeComplete = false;
      expect(client.isConnected()).toBe(false);

      // Only handshake completed
      mockTransport.isConnected.mockReturnValue(false);
      (client as any).isHandshakeComplete = true;
      expect(client.isConnected()).toBe(false);

      // Both required
      mockTransport.isConnected.mockReturnValue(true);
      (client as any).isHandshakeComplete = true;
      expect(client.isConnected()).toBe(true);
    });
  });
});
