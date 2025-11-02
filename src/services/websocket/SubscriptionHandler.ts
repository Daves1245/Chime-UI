import logger from '@/logger';

const log = logger.child({ module: 'subscriptionHandler' });

/**
 * Handles channel subscription validation and state
 */
export class SubscriptionHandler {
  private confirmedChannels: string[] = [];

  constructor(private onChannelsConfirmed: (channels: string[]) => void) {}

  /**
   * Handle server's channel confirmation and validate against what we requested
   */
  handleChannelConfirmation(
    requestedChannels: string[],
    serverChannels: string[]
  ): void {
    log.info(
      {
        requestedChannels,
        serverChannels,
        requestedCount: requestedChannels.length,
        confirmedCount: serverChannels.length,
      },
      'Server channel confirmation received'
    );

    this.validateChannelConfirmation(requestedChannels, serverChannels);
    this.confirmedChannels = [...serverChannels];
    this.onChannelsConfirmed(serverChannels);
  }

  /**
   * Validate that server confirmed channels match our expectations
   */
  private validateChannelConfirmation(
    requestedChannels: string[],
    serverChannels: string[]
  ): void {
    const missingChannels = requestedChannels.filter(
      ch => !serverChannels.includes(ch)
    );
    const unexpectedChannels = serverChannels.filter(
      ch => !requestedChannels.includes(ch)
    );

    if (missingChannels.length > 0) {
      log.error(
        {
          missingChannels,
          missingCount: missingChannels.length,
          requestedChannels,
          serverChannels,
        },
        'Server did not confirm all requested channels - subscription incomplete'
      );
    }

    if (unexpectedChannels.length > 0) {
      log.warn(
        {
          unexpectedChannels,
          unexpectedCount: unexpectedChannels.length,
          requestedChannels,
          serverChannels,
        },
        'Server confirmed channels we did not request - possible gateway behavior'
      );
    }

    if (missingChannels.length === 0 && unexpectedChannels.length === 0) {
      log.debug('Server confirmed exactly the channels we requested');
    }
  }

  /**
   * Get currently confirmed channels from server
   */
  getConfirmedChannels(): string[] {
    return [...this.confirmedChannels];
  }

  /**
   * Check if a channel is confirmed by server (utility for MessageSender)
   */
  isChannelConfirmed(channelId: string): boolean {
    return this.confirmedChannels.includes(channelId);
  }

  /**
   * Reset state (on disconnect)
   */
  reset(): void {
    this.confirmedChannels = [];
    log.debug('Subscription state reset');
  }
}
