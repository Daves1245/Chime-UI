import logger from '@/logger';
import {
  Message,
  ChimeMessage,
  parseMessage,
  validateMessage,
} from '@/types/Message';

const log = logger.child({ module: 'messageHandler' });

/**
 * Handles incoming WebSocket messages and routes them appropriately
 */
export class MessageHandler {
  constructor(
    private onChatMessage: (message: ChimeMessage) => void,
    private onConnected: (userId: string, channels: string[]) => void,
    private onError: (error: string, details?: string) => void
  ) {}

  /**
   * Processes incoming WebSocket message and routes to appropriate handler
   */
  handleMessage(rawData: string): void {
    try {
      const message = parseMessage(rawData);
      this.validateAndRoute(message);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown parsing error';
      log.error({ error, rawData }, 'Failed to parse WebSocket message');
      this.onError(`Message parsing failed: ${errorMsg}`);
    }
  }

  private validateAndRoute(message: Message): void {
    const validation = validateMessage(message);

    if (!validation.valid) {
      log.error(
        {
          message,
          validationErrors: validation.errors,
        },
        'Message validation failed'
      );

      this.onError(
        'Invalid message received',
        `Validation errors: ${validation.errors.join(', ')}`
      );
      return;
    }

    this.routeMessage(message);
  }

  private routeMessage(message: Message): void {
    log.debug({ messageType: message.type }, 'Routing validated message');

    switch (message.type) {
      case 'message':
        this.handleChatMessage(message);
        break;
      case 'connected':
        this.handleConnectedResponse(message);
        break;
      case 'error':
        this.handleErrorResponse(message);
        break;
      case 'connect':
        log.debug(
          'Received connect message (ignoring - client-to-server only)'
        );
        break;
    }
  }

  private handleChatMessage(
    message: Extract<Message, { type: 'message' }>
  ): void {
    log.info(
      {
        channelId: message.message.channelId,
        userId: message.message.userId,
        messageId: message.message.messageId,
      },
      'Processing chat message'
    );

    this.onChatMessage(message.message);
  }

  private handleConnectedResponse(
    message: Extract<Message, { type: 'connected' }>
  ): void {
    log.info(
      {
        userId: message.userId,
        channels: message.channels,
      },
      'Connection acknowledged by server'
    );

    this.onConnected(message.userId, message.channels);
  }

  private handleErrorResponse(
    message: Extract<Message, { type: 'error' }>
  ): void {
    log.error(
      {
        error: message.message,
        details: message.details,
      },
      'Server error received'
    );

    this.onError(message.message, message.details);
  }
}
