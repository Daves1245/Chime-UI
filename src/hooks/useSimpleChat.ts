import { useMemo } from 'react';
import { useChat } from '@/contexts/ChatContext';

/**
 * Simple chat hook that provides easy access to chat functionality
 * Replaces the complex useChimeChat hook
 */
export function useSimpleChat(channelId?: string) {
  const chatContext = useChat();

  // Filter messages for specific channel if provided
  const channelMessages = useMemo(() => {
    if (!channelId) return chatContext.messages;
    return chatContext.messages.filter(msg => msg.channelId === channelId);
  }, [chatContext.messages, channelId]);

  return {
    // Connection state
    isConnected: chatContext.isConnected,
    isInitialized: chatContext.isInitialized,
    connectionStatus: chatContext.connectionStatus,
    confirmedChannels: chatContext.confirmedChannels,
    error: chatContext.error,

    // Messages
    messages: channelMessages,
    allMessages: chatContext.messages,

    // Actions
    sendMessage: chatContext.sendMessage,

    // Convenience methods
    sendToChannel: (content: string) => {
      if (!channelId) {
        throw new Error('No channel specified for sendToChannel');
      }
      chatContext.sendMessage(channelId, content);
    },

    isChannelConfirmed: (channel: string) => {
      return chatContext.confirmedChannels.includes(channel);
    },
  };
}
