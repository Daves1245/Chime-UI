import logger from '@/logger';
import { apiClient, ApiResponse } from './api-client';
import User from '@/models/User';

const log = logger.child({ module: 'messageService' });

export interface Message {
  messageId: string;
  channelId: string;
  channelName?: string; // Add optional channelName field
  userId: string;
  content: string; // Changed from 'text' to 'content' to match API
  createdAt: string; // Changed from 'timestamp' to 'createdAt' to match API
  editedAt?: string | null;
  metadata?: Record<string, unknown>; // Changed from any to unknown
  user?: User; // Keep user field for frontend compatibility
}

export interface MessagesResponse {
  messages: Message[];
  count: number;
  hasMore: boolean;
  channelName?: string; // Channel name at response level
}

export interface SendMessageRequest {
  text: string;
  channelId: string;
  userId: string;
}

export class MessageService {
  async getMessagesByChannel(
    channelId: string
  ): Promise<ApiResponse<MessagesResponse>> {
    log.debug(
      { function: 'getMessagesByChannel', channelId },
      'Fetching messages by channel'
    );
    const result = await apiClient.get<MessagesResponse>(
      `/messages/${channelId}`
    );

    if (result.error) {
      log.error(
        { function: 'getMessagesByChannel', channelId, error: result.error },
        'Failed to fetch messages by channel'
      );
    } else {
      log.info(
        {
          function: 'getMessagesByChannel',
          channelId,
          messageCount: result.data?.count,
          hasMore: result.data?.hasMore,
        },
        'Successfully fetched messages by channel'
      );
    }

    return result;
  }

  async sendMessage(
    messageData: SendMessageRequest
  ): Promise<ApiResponse<Message>> {
    log.debug(
      {
        function: 'sendMessage',
        channelId: messageData.channelId,
        userId: messageData.userId,
        textLength: messageData.text.length,
      },
      'Sending message'
    );

    const result = await apiClient.post<Message>('/messages/send', messageData);

    if (result.error) {
      log.error(
        {
          function: 'sendMessage',
          channelId: messageData.channelId,
          userId: messageData.userId,
          error: result.error,
        },
        'Failed to send message'
      );
    } else {
      log.info(
        {
          function: 'sendMessage',
          messageId: result.data?.messageId,
          channelId: messageData.channelId,
          userId: messageData.userId,
        },
        'Successfully sent message'
      );
    }

    return result;
  }
}

export const messageService = new MessageService();
