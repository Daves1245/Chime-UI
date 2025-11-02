import { chatService } from '@/services/chat-service';
import ChimeChatClient from '@/services/ChimeClient';
import { apiService } from '@/services/api-service';

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

// Mock ChimeChatClient
jest.mock('@/services/ChimeClient');

// Mock API service
jest.mock('@/services/api-service', () => ({
  apiService: {
    servers: {
      getAllServers: jest.fn(),
    },
    channels: {
      getChannelsByServer: jest.fn(),
    },
  },
}));

// Mock fetch for config endpoint
global.fetch = jest.fn();

describe('ChatService', () => {
  let mockClient: jest.Mocked<ChimeChatClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the service state
    (chatService as any).client = null;
    (chatService as any).isInitialized = false;
    (chatService as any).reconnectAttempts = 0;

    // Create mock client
    mockClient = {
      connect: jest.fn(),
      sendChatMessage: jest.fn(),
      sendMessage: jest.fn(),
      disconnect: jest.fn(),
      isConnected: jest.fn(),
      getConnectionStatus: jest.fn(),
      getChannels: jest.fn(),
      setHandlers: jest.fn(),
    } as any;

    (
      ChimeChatClient as jest.MockedClass<typeof ChimeChatClient>
    ).mockImplementation(() => mockClient);
  });

  afterEach(() => {
    chatService.shutdown();
  });

  describe('initialization', () => {
    beforeEach(() => {
      // Mock successful config fetch
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ websocket: { url: 'ws://localhost:3141/ws' } }),
      });

      // Mock successful servers fetch
      (apiService.servers.getAllServers as jest.Mock).mockResolvedValue({
        data: [
          { id: 'server1', channels: ['general', 'random'] },
          { id: 'server2', channels: ['dev', 'announcements'] },
        ],
        error: null,
      });

      // Mock successful channel fetch
      (apiService.channels.getChannelsByServer as jest.Mock).mockResolvedValue({
        data: [{ name: 'api-channel1' }, { name: 'api-channel2' }],
      });

      mockClient.connect.mockResolvedValue();
    });

    it('should initialize successfully with user channels', async () => {
      await chatService.initialize();

      expect(ChimeChatClient).toHaveBeenCalledWith('ws://localhost:3141/ws');
      expect(mockClient.setHandlers).toHaveBeenCalled();
      expect(mockClient.connect).toHaveBeenCalledWith(
        expect.arrayContaining([
          'general',
          'random',
          'dev',
          'announcements',
          'api-channel1',
          'api-channel2',
        ])
      );
      expect(chatService.isConnected()).toBe(false); // Mock returns false by default
    });

    it('should handle config fetch failure with fallback', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('Config fetch failed')
      );

      await chatService.initialize();

      expect(ChimeChatClient).toHaveBeenCalledWith('ws://localhost:3141/ws'); // Fallback URL
      expect(mockClient.connect).toHaveBeenCalled();
    });

    it('should handle servers fetch failure with fallback channels', async () => {
      (apiService.servers.getAllServers as jest.Mock).mockResolvedValue({
        data: null,
        error: 'API error',
      });

      await chatService.initialize();

      expect(mockClient.connect).toHaveBeenCalledWith(['general']);
    });

    it('should not reinitialize if already initialized', async () => {
      await chatService.initialize();

      // Second call should not create new client
      await chatService.initialize();

      expect(ChimeChatClient).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization errors', async () => {
      const error = new Error('WebSocket connection failed');
      mockClient.connect.mockRejectedValue(error);

      await expect(chatService.initialize()).rejects.toThrow(
        'WebSocket connection failed'
      );
    });

    it('should deduplicate channels from multiple sources', async () => {
      (apiService.servers.getAllServers as jest.Mock).mockResolvedValue({
        data: [
          { id: 'server1', channels: ['general', 'random'] },
          { id: 'server2', channels: ['general', 'dev'] }, // Duplicate 'general'
        ],
        error: null,
      });

      (apiService.channels.getChannelsByServer as jest.Mock).mockResolvedValue({
        data: [{ name: 'general' }, { name: 'api-only' }], // Another duplicate 'general'
      });

      await chatService.initialize();

      expect(mockClient.connect).toHaveBeenCalledWith(
        expect.arrayContaining(['general', 'random', 'dev', 'api-only'])
      );
    });
  });

  describe('message sending', () => {
    beforeEach(async () => {
      // Setup initialized service
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ websocket: { url: 'ws://test' } }),
      });
      (apiService.servers.getAllServers as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });
      mockClient.connect.mockResolvedValue();

      await chatService.initialize();
    });

    it('should send chat messages', () => {
      chatService.sendMessage('general', 'Hello world');

      expect(mockClient.sendChatMessage).toHaveBeenCalledWith(
        'general',
        'Hello world'
      );
    });

    it('should handle send errors', () => {
      const error = new Error('Send failed');
      mockClient.sendChatMessage.mockImplementation(() => {
        throw error;
      });

      expect(() => chatService.sendMessage('general', 'test')).toThrow(
        'Send failed'
      );
    });

    it('should throw error when not initialized', () => {
      chatService.shutdown(); // Reset initialization

      expect(() => chatService.sendMessage('general', 'test')).toThrow(
        'Chat service not initialized'
      );
    });
  });

  describe('status methods', () => {
    beforeEach(async () => {
      // Setup initialized service
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ websocket: { url: 'ws://test' } }),
      });
      (apiService.servers.getAllServers as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });
      mockClient.connect.mockResolvedValue();

      await chatService.initialize();
    });

    it('should return connection status', () => {
      const mockStatus = {
        state: 'connected' as any,
        isConnected: true,
        confirmedChannels: ['general', 'random'],
      };
      mockClient.getConnectionStatus.mockReturnValue(mockStatus);

      const status = chatService.getConnectionStatus();

      expect(status).toBe(mockStatus);
    });

    it('should return null status when not initialized', () => {
      chatService.shutdown();

      const status = chatService.getConnectionStatus();

      expect(status).toBeNull();
    });

    it('should return connected status', () => {
      mockClient.isConnected.mockReturnValue(true);

      expect(chatService.isConnected()).toBe(true);
    });

    it('should return channels', () => {
      const channels = ['general', 'random'];
      mockClient.getChannels.mockReturnValue(channels);

      expect(chatService.getChannels()).toBe(channels);
    });
  });

  describe('event handling', () => {
    let clientHandlers: any;

    beforeEach(async () => {
      // Setup initialized service
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ websocket: { url: 'ws://test' } }),
      });
      (apiService.servers.getAllServers as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });
      mockClient.connect.mockResolvedValue();

      await chatService.initialize();

      // Extract handlers passed to client
      clientHandlers = mockClient.setHandlers.mock.calls[0][0];
    });

    it('should handle chat messages', () => {
      const mockHandlers = { onMessage: jest.fn() };
      chatService.setHandlers(mockHandlers);

      const message = {
        channelId: 'general',
        messageId: 'msg-123',
        userId: 'user-456',
        content: 'Hello!',
        createdAt: '2023-01-01T12:00:00Z',
        editedAt: null,
        metadata: {},
      };

      clientHandlers.onChatMessage(message);

      expect(mockHandlers.onMessage).toHaveBeenCalledWith(message);
    });

    it('should handle connection events', () => {
      const mockHandlers = { onConnectionStatusChanged: jest.fn() };
      chatService.setHandlers(mockHandlers);

      // Mock getConnectionStatus to return a valid status
      mockClient.getConnectionStatus.mockReturnValue({
        state: 'connected' as any,
        isConnected: true,
        confirmedChannels: ['general', 'random'],
      });

      clientHandlers.onConnected(['general', 'random']);

      expect(mockHandlers.onConnectionStatusChanged).toHaveBeenCalled();
    });

    it('should handle errors', () => {
      const mockHandlers = { onError: jest.fn() };
      chatService.setHandlers(mockHandlers);

      clientHandlers.onError('Connection failed', 'Network error');

      expect(mockHandlers.onError).toHaveBeenCalledWith(
        'Connection failed',
        'Network error'
      );
    });

    it('should handle disconnection', () => {
      const mockHandlers = { onConnectionStatusChanged: jest.fn() };
      chatService.setHandlers(mockHandlers);

      // Mock getConnectionStatus to return a valid status
      mockClient.getConnectionStatus.mockReturnValue({
        state: 'disconnected' as any,
        isConnected: false,
        confirmedChannels: [],
      });

      clientHandlers.onDisconnected();

      expect(mockHandlers.onConnectionStatusChanged).toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    beforeEach(async () => {
      // Setup initialized service
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ websocket: { url: 'ws://test' } }),
      });
      (apiService.servers.getAllServers as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });
      mockClient.connect.mockResolvedValue();

      await chatService.initialize();
    });

    it('should shutdown cleanly', () => {
      chatService.shutdown();

      expect(mockClient.disconnect).toHaveBeenCalled();
      expect(chatService.isConnected()).toBe(false);
    });

    it('should be safe to call multiple times', () => {
      chatService.shutdown();
      chatService.shutdown();

      expect(mockClient.disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('reconnection logic', () => {
    beforeEach(async () => {
      jest.useFakeTimers();

      // Setup initialized service
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ websocket: { url: 'ws://test' } }),
      });
      (apiService.servers.getAllServers as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });
      mockClient.connect.mockResolvedValue();

      await chatService.initialize();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should attempt reconnection on connection errors', async () => {
      const clientHandlers = mockClient.setHandlers.mock.calls[0][0];

      // Ensure mock API calls are set up for reconnection
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ websocket: { url: 'ws://localhost:3141/ws' } }),
      });
      (apiService.servers.getAllServers as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      // Reset connect mock for reconnection
      mockClient.connect.mockClear();
      mockClient.connect.mockResolvedValue();

      // Trigger connection error
      clientHandlers.onError('Connection failed');

      // Verify reconnection timeout was set
      expect((chatService as any).reconnectTimeout).toBeTruthy();

      // Use runAllTimers to run all pending timers
      jest.runAllTimers();

      // Wait for microtasks to complete
      await Promise.resolve();

      expect(ChimeChatClient).toHaveBeenCalledTimes(2); // Original + reconnection
    });

    it('should use exponential backoff for reconnections', async () => {
      const clientHandlers = mockClient.setHandlers.mock.calls[0][0];

      // Mock failed reconnections
      mockClient.connect.mockRejectedValue(new Error('Still failing'));

      // Trigger multiple failures
      clientHandlers.onDisconnected();

      // First attempt at 1000ms
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();

      // Second attempt at 2000ms
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
      await Promise.resolve();

      // Third attempt at 4000ms
      jest.advanceTimersByTime(4000);
      await Promise.resolve();
      await Promise.resolve();

      expect(ChimeChatClient).toHaveBeenCalledTimes(4); // Original + 3 reconnection attempts
    });
  });
});
