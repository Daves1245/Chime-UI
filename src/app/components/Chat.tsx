'use client';

import React, { useState, useRef, useEffect } from 'react';
import ChatHistory from './ChatHistory';
import Server from '@/models/Server';
import UserList from './UserList';
import { useChat } from '@/contexts/ChatContext';
import { ChimeMessage } from '@/types/Message';
import logger from '@/logger';
import { apiClient } from '@/services/api-client';

const log = logger.child({ module: 'chatComponent' });

interface ChatServerProps {
  server: Server;
  channel: string;
}

const Chat: React.FC<ChatServerProps> = ({ server, channel }) => {
  const [history, setHistory] = useState<ChimeMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    sendMessage: chatSendMessage,
    isConnected,
    error,
  } = useChat();

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    });
  };

  // Scroll to bottom when component mounts
  useEffect(() => {

    const fetchPrevMessages = async () => {
      try {
        setLoading(true);
        log.debug('set loading true');
        
        // Fetch messages from API
        const response = await apiClient.get<ChimeMessage[]>(`/messages/channel/${channel}?limit=50`);
        
        if (response.data) {
          log.debug({ messageCount: response.data.length }, 'Fetched messages from API');
          setHistory(response.data);
        } else if (response.error) {
          log.warn({ error: response.error }, 'Failed to fetch messages from API');
        }
        
      } catch (err) {
        log.error(`Error fetching messages: ${err instanceof Error ? err.message : err})`)
      } finally {
        setLoading(false);
        log.debug('set loading false');
      }
    };

    scrollToBottom();
    log.debug('queueing fetchPrevMessages to be called');
    fetchPrevMessages();
  }, []);

  // Scroll to bottom when history changes
  useEffect(() => {
    scrollToBottom();
  }, [history]);

  // Load messages from chat context when they change
  useEffect(() => {
    // Filter ChimeMessages for current channel
    const channelMessages = messages.filter(msg => msg.channelId === channel);
    setHistory(channelMessages);

    log.debug(
      {
        source: 'Channel_Filter',
        channel,
        totalMessages: messages.length,
        filteredCount: channelMessages.length,
      },
      'Chat: Updated history for channel'
    );
  }, [messages, channel]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    log.info(
      {
        source: 'User_Send_Action',
        channel,
        messageText:
          messageText.substring(0, 50) + (messageText.length > 50 ? '...' : ''),
        isConnected,
        currentHistoryCount: history.length,
      },
      'Chat: User initiated send message'
    );

    try {
      if (isConnected) {
        chatSendMessage(channel, messageText);
        log.info(
          {
            source: 'User_Send_Action',
            channel,
            success: true,
          },
          'Chat: Message sent via chatSendMessage (should appear via WebSocket echo)'
        );
      } else {
        // Show error when not connected instead of API fallback
        console.error('Cannot send message: WebSocket not connected');
        log.error(
          {
            source: 'User_Send_Action',
            channel,
            error: 'Not connected',
          },
          'Chat: Cannot send message - not connected'
        );
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      log.error(
        {
          source: 'User_Send_Action',
          channel,
          error,
        },
        'Chat: Failed to send message'
      );
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(text);
      setText('');
    }
  };

  const channelHistory = history;

  return (
    <div className="flex flex-col h-full w-full border-l border-border-highlight">
      {/* Header */}
      <div className="h-[3em] flex-shrink-0 bg-box-background border-b border-border-highlight flex justify-between items-center px-4">
        <div className="select-none font-semibold"># {channel}</div>
        <div className="text-sm text-gray-400">
          {isConnected && 'Live'}
          {error && 'Disconnected'}
          {!isConnected && !error && 'Offline'}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-row flex-grow min-h-0">
        {/* Chat area */}
        <div className="flex-grow flex flex-col bg-background min-h-0">
          {/* Chat History - This is the key fix */}
          <div
            ref={chatContainerRef}
            className="flex-grow overflow-y-auto bg-background min-h-0 p-2"
          >
            <ChatHistory history={channelHistory} loading={loading} />
          </div>

          {/* Message input */}
          <div className="w-full p-2 flex-shrink-0 bg-background border-t border-border-highlight">
            <textarea
              className="w-full h-20 resize-none bg-box-background border border-box-highlight rounded-lg p-2 text-[16px] text-[#ffffff] focus:outline-none focus:border-[#757575]"
              value={text}
              placeholder={`Message #${channel}...`}
              onKeyDown={handleKeyPress}
              onChange={onChange}
              disabled={!isConnected}
            />
            {error && (
              <div className="text-red-400 text-sm mt-1">
                WebSocket error: {error}
              </div>
            )}
            {!isConnected && !error && (
              <div className="text-yellow-400 text-sm mt-1">
                Connecting to chat server...
              </div>
            )}
          </div>
        </div>

        {/* User list */}
        <div className="w-[15%] flex-shrink-0 bg-background border-l border-border-highlight">
          <UserList server={server} showHeader={false} />
        </div>
      </div>
    </div>
  );
};

export default Chat;
