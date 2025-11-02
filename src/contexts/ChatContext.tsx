'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { ChimeMessage } from '@/types/Message';
import { ConnectionStatus } from '@/services/ChimeClient';
import { globalConnectionManager } from '@/services/GlobalConnectionManager';
import logger from '@/logger';

const log = logger.child({ module: 'chatContext' });

interface ChatContextState {
  // Connection state
  connectionStatus: ConnectionStatus | null;
  isConnected: boolean;
  confirmedChannels: string[];

  // Messages - storing ChimeMessage objects (the actual chat messages)
  messages: ChimeMessage[];

  // Actions
  sendMessage: (channelId: string, content: string) => void;

  // Status
  isInitialized: boolean;
  error: string | null;
}

const ChatContext = createContext<ChatContextState | null>(null);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus | null>(null);
  const [messages, setMessages] = useState<ChimeMessage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (errorMsg: string, details?: string) => {
    const fullError = details ? `${errorMsg}: ${details}` : errorMsg;
    log.error({ error: fullError }, 'Chat service error');
    setError(fullError);
  };

  useEffect(() => {
    let mounted = true;

    // Subscribe to connection events
    const cleanupHandlers = [
      globalConnectionManager.on(
        'message-received',
        (message: ChimeMessage) => {
          if (!mounted) return;
          log.info(
            {
              messageId: message.messageId,
              channelId: message.channelId,
              userId: message.userId,
            },
            'ChatContext: Adding message from WebSocket'
          );

          // Store ChimeMessage directly
          setMessages(prev => [...prev, message]);
        }
      ),

      globalConnectionManager.on(
        'connection-status-changed',
        (status: ConnectionStatus | null) => {
          if (!mounted) return;
          log.debug({ status }, 'Connection status changed');
          setConnectionStatus(status);
          setError(null); // Clear errors on successful connection
        }
      ),

      globalConnectionManager.on('error', (errorMsg: string) => {
        if (!mounted) return;
        handleError(errorMsg);
      }),
    ];

    // Get initial state
    setConnectionStatus(globalConnectionManager.getConnectionStatus());
    // Get ChimeMessages from GlobalConnectionManager
    const initialMessages = globalConnectionManager
      .getMessages()
      .filter(msg => msg.type === 'message')
      .map(msg => msg.message);

    log.info(
      {
        source: 'Initial_Load',
        messageCount: initialMessages.length,
        messages: initialMessages.map(m => ({
          id: m.messageId,
          channel: m.channelId,
          content: m.content.substring(0, 30),
        })),
      },
      'ChatContext: Loading initial messages from GlobalConnectionManager'
    );

    setMessages(initialMessages);
    setIsInitialized(true);

    log.info('Chat context subscribed to connection events');

    // Cleanup on unmount
    return () => {
      mounted = false;
      cleanupHandlers.forEach(cleanup => cleanup());
    };
  }, []);

  const sendMessage = (channelId: string, content: string) => {
    log.info(
      {
        source: 'User_Input',
        channelId,
        content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        currentMessageCount: messages.length,
      },
      'ChatContext: User sending message (should NOT add to local state)'
    );

    try {
      globalConnectionManager.sendMessage(channelId, content);
      log.info(
        {
          source: 'User_Input',
          channelId,
          success: true,
        },
        'ChatContext: Message sent to GlobalConnectionManager (waiting for WebSocket echo)'
      );
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to send message';
      log.error({ error: err, channelId }, errorMsg);
      setError(errorMsg);
    }
  };

  const contextValue: ChatContextState = {
    connectionStatus,
    isConnected: connectionStatus?.isConnected || false,
    confirmedChannels: connectionStatus?.confirmedChannels || [],
    messages,
    sendMessage,
    isInitialized,
    error,
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

export function useChat(): ChatContextState {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
