import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { ChatProvider, useChat } from '@/contexts/ChatContext';
import { appInitializer } from '@/services/app-initializer';
import { chatService } from '@/services/chat-service';

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
  public sentMessages: string[] = [];

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    this.sentMessages.push(data);
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }

  // Test helper methods
  simulateMessage(data: string): void {
    this.onmessage?.(new MessageEvent('message', { data }));
  }

  getLastSentMessage(): any {
    const lastMessage = this.sentMessages[this.sentMessages.length - 1];
    return lastMessage ? JSON.parse(lastMessage) : null;
  }
}

(global as any).WebSocket = MockWebSocket;

// Mock fetch
global.fetch = jest.fn();

// Mock API service
jest.mock('../../src/services/api-service', () => ({
  apiService: {
    servers: {
      getAllServers: jest.fn(),
    },
    channels: {
      getChannelsByServer: jest.fn(),
    },
  },
}));

import { apiService } from '../../src/services/api-service';

// Test component to access chat context
function TestComponent() {
  const chat = useChat();

  return (
    <div>
      <div data-testid="connection-status">
        {chat.isConnected ? 'connected' : 'disconnected'}
      </div>
      <div data-testid="initialized-status">
        {chat.isInitialized ? 'initialized' : 'not-initialized'}
      </div>
      <div data-testid="channels">{chat.confirmedChannels.join(',')}</div>
      <div data-testid="messages">
        {chat.messages.map(msg => `${msg.channelId}:${msg.content}`).join('|')}
      </div>
      <button
        data-testid="send-button"
        onClick={() => chat.sendMessage('general', 'Hello')}
      >
        Send
      </button>
      {chat.error && <div data-testid="error">{chat.error}</div>}
    </div>
  );
}

describe('Chat Integration Tests', () => {
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful config and API responses
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ websocket: { url: 'ws://localhost:3141/ws' } }),
    });

    (apiService.servers.getAllServers as jest.Mock).mockResolvedValue({
      data: [
        { id: 'server1', channels: ['general', 'random'] },
        { id: 'server2', channels: ['dev'] },
      ],
      error: null,
    });

    (apiService.channels.getChannelsByServer as jest.Mock).mockResolvedValue({
      data: [{ name: 'api-channel' }],
    });

    // Capture the WebSocket instance for testing
    const originalWebSocket = (global as any).WebSocket;
    (global as any).WebSocket = function (url: string) {
      mockWebSocket = new MockWebSocket(url);
      return mockWebSocket;
    };
    (global as any).WebSocket.CONNECTING = MockWebSocket.CONNECTING;
    (global as any).WebSocket.OPEN = MockWebSocket.OPEN;
    (global as any).WebSocket.CLOSING = MockWebSocket.CLOSING;
    (global as any).WebSocket.CLOSED = MockWebSocket.CLOSED;
  });

  afterEach(async () => {
    await act(async () => {
      appInitializer.shutdown();
    });
  });

  it('should complete full initialization and connection flow', async () => {
    const { getByTestId } = render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    // Initially not initialized
    expect(getByTestId('initialized-status')).toHaveTextContent(
      'not-initialized'
    );
    expect(getByTestId('connection-status')).toHaveTextContent('disconnected');

    // Wait for initialization to complete
    await waitFor(
      () => {
        expect(getByTestId('initialized-status')).toHaveTextContent(
          'initialized'
        );
      },
      { timeout: 5000 }
    );

    // Wait for WebSocket connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50)); // Allow WebSocket to "connect"
    });

    // Check that handshake was sent
    const handshakeMessage = mockWebSocket.getLastSentMessage();
    expect(handshakeMessage).toEqual({
      type: 'connect',
      config: {
        channels: ['general', 'random', 'api-channel', 'dev'],
      },
    });

    // Simulate server handshake response
    await act(async () => {
      mockWebSocket.simulateMessage(
        JSON.stringify({
          type: 'connected',
          userId: 'test-user-123',
          channels: ['general', 'random', 'dev'],
        })
      );
    });

    // Wait for connection to be established
    await waitFor(() => {
      expect(getByTestId('connection-status')).toHaveTextContent('connected');
    });

    expect(getByTestId('channels')).toHaveTextContent('general,random,dev');
  });

  it('should handle incoming chat messages', async () => {
    const { getByTestId } = render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    // Wait for initialization
    await waitFor(() => {
      expect(getByTestId('initialized-status')).toHaveTextContent(
        'initialized'
      );
    });

    // Complete handshake
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      mockWebSocket.simulateMessage(
        JSON.stringify({
          type: 'connected',
          userId: 'test-user',
          channels: ['general'],
        })
      );
    });

    // Wait for connection
    await waitFor(() => {
      expect(getByTestId('connection-status')).toHaveTextContent('connected');
    });

    // Simulate incoming chat message
    await act(async () => {
      mockWebSocket.simulateMessage(
        JSON.stringify({
          type: 'message',
          message: {
            channelId: 'general',
            messageId: 'msg-123',
            userId: 'other-user',
            content: 'Hello everyone!',
            createdAt: '2023-01-01T12:00:00Z',
            editedAt: null,
            metadata: {},
          },
        })
      );
    });

    // Check message appears in context
    await waitFor(() => {
      expect(getByTestId('messages')).toHaveTextContent(
        'general:Hello everyone!'
      );
    });
  });

  it('should send chat messages', async () => {
    const { getByTestId } = render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    // Wait for initialization and connection
    await waitFor(() => {
      expect(getByTestId('initialized-status')).toHaveTextContent(
        'initialized'
      );
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      mockWebSocket.simulateMessage(
        JSON.stringify({
          type: 'connected',
          userId: 'test-user',
          channels: ['general'],
        })
      );
    });

    await waitFor(() => {
      expect(getByTestId('connection-status')).toHaveTextContent('connected');
    });

    // Clear previous messages (handshake)
    mockWebSocket.sentMessages = [];

    // Send a message
    await act(async () => {
      getByTestId('send-button').click();
    });

    // Check message was sent
    const sentMessage = mockWebSocket.getLastSentMessage();
    expect(sentMessage.type).toBe('message');
    expect(sentMessage.message.channelId).toBe('general');
    expect(sentMessage.message.content).toBe('Hello');
    expect(sentMessage.message.userId).toBe(''); // Server will fill this
  });

  it('should handle connection errors and recovery', async () => {
    const { getByTestId } = render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    // Wait for initialization
    await waitFor(() => {
      expect(getByTestId('initialized-status')).toHaveTextContent(
        'initialized'
      );
    });

    // Simulate connection error
    await act(async () => {
      mockWebSocket.simulateMessage(
        JSON.stringify({
          type: 'error',
          message: 'Connection failed',
          details: 'Network timeout',
        })
      );
    });

    // Check error appears
    await waitFor(() => {
      expect(getByTestId('error')).toHaveTextContent(
        'Connection failed: Network timeout'
      );
    });
  });

  it('should handle server channel confirmation discrepancies', async () => {
    const { getByTestId } = render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    await waitFor(() => {
      expect(getByTestId('initialized-status')).toHaveTextContent(
        'initialized'
      );
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Server confirms different channels than requested
    await act(async () => {
      mockWebSocket.simulateMessage(
        JSON.stringify({
          type: 'connected',
          userId: 'test-user',
          channels: ['general', 'announcements'], // Different from requested
        })
      );
    });

    await waitFor(() => {
      expect(getByTestId('connection-status')).toHaveTextContent('connected');
      expect(getByTestId('channels')).toHaveTextContent(
        'general,announcements'
      );
    });
  });

  it('should handle API failures gracefully', async () => {
    // Mock API failure
    (apiService.servers.getAllServers as jest.Mock).mockResolvedValue({
      data: null,
      error: 'API unavailable',
    });

    const { getByTestId } = render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    // Should still initialize with fallback
    await waitFor(
      () => {
        expect(getByTestId('initialized-status')).toHaveTextContent(
          'initialized'
        );
      },
      { timeout: 5000 }
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Check fallback channel was used
    const handshakeMessage = mockWebSocket.getLastSentMessage();
    expect(handshakeMessage.config.channels).toEqual(['general']);
  });

  it('should handle WebSocket configuration fetch failure', async () => {
    // Mock config fetch failure
    (global.fetch as jest.Mock).mockRejectedValue(
      new Error('Config fetch failed')
    );

    const { getByTestId } = render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    // Should still initialize with fallback URL
    await waitFor(
      () => {
        expect(getByTestId('initialized-status')).toHaveTextContent(
          'initialized'
        );
      },
      { timeout: 5000 }
    );

    // Check that fallback WebSocket URL was used
    expect(mockWebSocket.url).toBe('ws://localhost:3141/ws');
  });
});
