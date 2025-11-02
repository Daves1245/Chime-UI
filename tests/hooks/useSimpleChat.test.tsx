import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { useSimpleChat } from '../../src/hooks/useSimpleChat';
import { ChatProvider, useChat } from '../../src/contexts/ChatContext';
import { ChimeMessage } from '../../src/types/Message';
import { ConnectionStatus } from '@/services/ChimeClient';

// Mock the entire ChatContext
jest.mock('../../src/contexts/ChatContext', () => ({
  useChat: jest.fn(),
  ChatProvider: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe('useSimpleChat', () => {
  let mockChatContext: ReturnType<typeof useChat>;

  beforeEach(() => {
    mockChatContext = {
      isConnected: true,
      isInitialized: true,
      connectionStatus: {
        state: 'connected' as any,
        isConnected: true,
        confirmedChannels: ['general', 'random', 'dev'],
      } as ConnectionStatus,
      confirmedChannels: ['general', 'random', 'dev'],
      error: null,
      messages: [
        {
          channelId: 'general',
          messageId: 'msg1',
          userId: 'user1',
          content: 'Hello general',
          createdAt: '2023-01-01T10:00:00Z',
          editedAt: null,
          metadata: {},
        },
        {
          channelId: 'random',
          messageId: 'msg2',
          userId: 'user2',
          content: 'Hello random',
          createdAt: '2023-01-01T10:01:00Z',
          editedAt: null,
          metadata: {},
        },
        {
          channelId: 'general',
          messageId: 'msg3',
          userId: 'user1',
          content: 'Another general message',
          createdAt: '2023-01-01T10:02:00Z',
          editedAt: null,
          metadata: {},
        },
      ] as ChimeMessage[],
      sendMessage: jest.fn(),
    };

    (useChat as jest.Mock).mockReturnValue(mockChatContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('without channel filter', () => {
    it('should return all chat context properties', () => {
      const { result } = renderHook(() => useSimpleChat());

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.connectionStatus).toBe(
        mockChatContext.connectionStatus
      );
      expect(result.current.confirmedChannels).toEqual([
        'general',
        'random',
        'dev',
      ]);
      expect(result.current.error).toBeNull();
      expect(result.current.sendMessage).toBe(mockChatContext.sendMessage);
    });

    it('should return all messages when no channel filter', () => {
      const { result } = renderHook(() => useSimpleChat());

      expect(result.current.messages).toHaveLength(3);
      expect(result.current.allMessages).toHaveLength(3);
      expect(result.current.messages).toBe(result.current.allMessages);
    });

    it('should provide sendMessage function', () => {
      const { result } = renderHook(() => useSimpleChat());

      result.current.sendMessage('test-channel', 'test message');

      expect(mockChatContext.sendMessage).toHaveBeenCalledWith(
        'test-channel',
        'test message'
      );
    });
  });

  describe('with channel filter', () => {
    it('should filter messages by channel', () => {
      const { result } = renderHook(() => useSimpleChat('general'));

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].content).toBe('Hello general');
      expect(result.current.messages[1].content).toBe(
        'Another general message'
      );
      expect(result.current.allMessages).toHaveLength(3); // All messages still available
    });

    it('should return empty array for non-existent channel', () => {
      const { result } = renderHook(() => useSimpleChat('non-existent'));

      expect(result.current.messages).toHaveLength(0);
      expect(result.current.allMessages).toHaveLength(3);
    });

    it('should provide sendToChannel convenience method', () => {
      const { result } = renderHook(() => useSimpleChat('general'));

      result.current.sendToChannel('Hello from general');

      expect(mockChatContext.sendMessage).toHaveBeenCalledWith(
        'general',
        'Hello from general'
      );
    });

    it('should throw error when calling sendToChannel without channel', () => {
      const { result } = renderHook(() => useSimpleChat());

      expect(() => {
        result.current.sendToChannel('test message');
      }).toThrow('No channel specified for sendToChannel');
    });
  });

  describe('channel confirmation utilities', () => {
    it('should check if channel is confirmed', () => {
      const { result } = renderHook(() => useSimpleChat());

      expect(result.current.isChannelConfirmed('general')).toBe(true);
      expect(result.current.isChannelConfirmed('random')).toBe(true);
      expect(result.current.isChannelConfirmed('non-existent')).toBe(false);
    });
  });

  describe('reactive updates', () => {
    it('should update when messages change', () => {
      const { result, rerender } = renderHook(() => useSimpleChat('general'));

      expect(result.current.messages).toHaveLength(2);

      // Add new message to context
      const newMessage: ChimeMessage = {
        channelId: 'general',
        messageId: 'msg4',
        userId: 'user3',
        content: 'New message',
        createdAt: '2023-01-01T10:03:00Z',
        editedAt: null,
        metadata: {},
      };

      mockChatContext.messages = [...mockChatContext.messages, newMessage];
      (useChat as jest.Mock).mockReturnValue(mockChatContext);

      rerender();

      expect(result.current.messages).toHaveLength(3);
      expect(result.current.messages[2].content).toBe('New message');
    });

    it('should update when channel filter changes', () => {
      let channelId = 'general';
      const { result, rerender } = renderHook(() => useSimpleChat(channelId));

      expect(result.current.messages).toHaveLength(2);

      // Change channel filter
      channelId = 'random';
      rerender();

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Hello random');
    });

    it('should update when connection status changes', () => {
      const { result, rerender } = renderHook(() => useSimpleChat());

      expect(result.current.isConnected).toBe(true);

      // Simulate disconnection
      mockChatContext.isConnected = false;
      mockChatContext.connectionStatus!.isConnected = false;
      (useChat as jest.Mock).mockReturnValue(mockChatContext);

      rerender();

      expect(result.current.isConnected).toBe(false);
    });

    it('should update when error state changes', () => {
      const { result, rerender } = renderHook(() => useSimpleChat());

      expect(result.current.error).toBeNull();

      // Simulate error
      mockChatContext.error = 'Connection failed';
      (useChat as jest.Mock).mockReturnValue(mockChatContext);

      rerender();

      expect(result.current.error).toBe('Connection failed');
    });
  });

  describe('edge cases', () => {
    it('should handle empty messages array', () => {
      mockChatContext.messages = [];
      (useChat as jest.Mock).mockReturnValue(mockChatContext);

      const { result } = renderHook(() => useSimpleChat('general'));

      expect(result.current.messages).toHaveLength(0);
      expect(result.current.allMessages).toHaveLength(0);
    });

    it('should handle undefined/null channel filter', () => {
      const { result } = renderHook(() => useSimpleChat(undefined));

      expect(result.current.messages).toHaveLength(3);
    });

    it('should handle missing confirmed channels', () => {
      mockChatContext.confirmedChannels = [];
      (useChat as jest.Mock).mockReturnValue(mockChatContext);

      const { result } = renderHook(() => useSimpleChat());

      expect(result.current.isChannelConfirmed('general')).toBe(false);
      expect(result.current.confirmedChannels).toEqual([]);
    });

    it('should handle null connection status', () => {
      mockChatContext.connectionStatus = null;
      (useChat as jest.Mock).mockReturnValue(mockChatContext);

      const { result } = renderHook(() => useSimpleChat());

      expect(result.current.connectionStatus).toBeNull();
    });
  });

  describe('memoization', () => {
    it('should memoize filtered messages', () => {
      const { result, rerender } = renderHook(() => useSimpleChat('general'));

      const firstMessages = result.current.messages;

      // Rerender without changing dependencies
      rerender();

      const secondMessages = result.current.messages;

      // Should be the same reference (memoized)
      expect(firstMessages).toBe(secondMessages);
    });

    it('should update memoized messages when dependencies change', () => {
      const { result, rerender } = renderHook(() => useSimpleChat('general'));

      const firstMessages = result.current.messages;

      // Change the messages in context
      mockChatContext.messages = mockChatContext.messages.slice(1); // Remove first message
      (useChat as jest.Mock).mockReturnValue(mockChatContext);

      rerender();

      const secondMessages = result.current.messages;

      // Should be different reference (recalculated)
      expect(firstMessages).not.toBe(secondMessages);
      expect(secondMessages).toHaveLength(1);
    });
  });
});
