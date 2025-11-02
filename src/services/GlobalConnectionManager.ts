import { EventEmitter } from '../util/EventEmitter';
import { chatService, ChatServiceHandlers } from './chat-service';
import { ConnectionStatus } from './ChimeClient';
import { ChimeMessage, Message } from '../types/Message';
import logger from '@/logger';

const log = logger.child({ module: 'globalConnectionManager' });

export interface ConnectionEvents {
  'connection-status-changed': ConnectionStatus | null;
  'message-received': ChimeMessage;
  error: string;
}

class GlobalConnectionManager extends EventEmitter {
  private static instance: GlobalConnectionManager | null = null;
  private isInitialized = false;
  private messages: Message[] = []; // Store full Message objects

  private constructor() {
    super();
    this.setupChatServiceHandlers();
  }

  static getInstance(): GlobalConnectionManager {
    if (!GlobalConnectionManager.instance) {
      GlobalConnectionManager.instance = new GlobalConnectionManager();
    }
    return GlobalConnectionManager.instance;
  }

  private setupChatServiceHandlers(): void {
    const handlers: ChatServiceHandlers = {
      onConnectionStatusChanged: status => {
        this.emit('connection-status-changed', status);
      },

      onMessage: message => {
        log.info(
          {
            source: 'ChatService_Handler',
            channelId: message.channelId,
            userId: message.userId,
            messageId: message.messageId,
            content:
              message.content.substring(0, 50) +
              (message.content.length > 50 ? '...' : ''),
            currentStoredCount: this.messages.length,
          },
          'GlobalConnectionManager: Received message from ChatService'
        );

        // Store the full Message object
        const fullMessage: Message = {
          type: 'message',
          message: message,
        };
        this.messages.push(fullMessage);

        log.info(
          {
            source: 'ChatService_Handler',
            messageId: message.messageId,
            channelId: message.channelId,
            newStoredCount: this.messages.length,
          },
          'GlobalConnectionManager: Stored message and emitting to listeners'
        );

        this.emit('message-received', message); // Still emit ChimeMessage for compatibility
      },

      onError: error => {
        this.emit('error', error);
      },
    };

    chatService.setHandlers(handlers);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await chatService.initialize();
      this.isInitialized = true;
    } catch (error) {
      this.emit(
        'error',
        error instanceof Error
          ? error.message
          : 'Failed to initialize connection'
      );
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    chatService.shutdown(); // Not async
    this.isInitialized = false;
    this.removeAllListeners();
  }

  sendMessage(channelId: string, content: string): void {
    if (!this.isInitialized) {
      throw new Error('Connection not initialized');
    }

    log.info(
      {
        source: 'Send_Request',
        channelId,
        content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      },
      'GlobalConnectionManager: Sending message via ChatService'
    );

    chatService.sendMessage(channelId, content);

    log.info(
      {
        source: 'Send_Request',
        channelId,
        success: true,
      },
      'GlobalConnectionManager: Message sent to ChatService'
    );
  }

  getConnectionStatus(): ConnectionStatus | null {
    return chatService.getConnectionStatus();
  }

  getMessages(): Message[] {
    return [...this.messages]; // Return Message objects instead of ChimeMessage
  }

  isConnected(): boolean {
    return chatService.isConnected();
  }
}

export const globalConnectionManager = GlobalConnectionManager.getInstance();
