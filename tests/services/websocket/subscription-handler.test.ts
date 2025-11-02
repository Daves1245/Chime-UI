import { SubscriptionHandler } from '../../../src/services/websocket/subscription-handler';

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

describe('SubscriptionHandler', () => {
  let subscriptionHandler: SubscriptionHandler;
  let mockOnChannelsConfirmed: jest.Mock;

  beforeEach(() => {
    mockOnChannelsConfirmed = jest.fn();
    subscriptionHandler = new SubscriptionHandler(mockOnChannelsConfirmed);
  });

  describe('handleChannelConfirmation', () => {
    it('should handle exact channel match successfully', () => {
      const requestedChannels = ['general', 'random', 'dev'];
      const serverChannels = ['general', 'random', 'dev'];

      subscriptionHandler.handleChannelConfirmation(
        requestedChannels,
        serverChannels
      );

      expect(mockOnChannelsConfirmed).toHaveBeenCalledWith(serverChannels);
      expect(subscriptionHandler.getConfirmedChannels()).toEqual(
        serverChannels
      );
    });

    it('should handle server confirming subset of requested channels', () => {
      const requestedChannels = ['general', 'random', 'dev', 'private'];
      const serverChannels = ['general', 'random', 'dev'];

      subscriptionHandler.handleChannelConfirmation(
        requestedChannels,
        serverChannels
      );

      expect(mockOnChannelsConfirmed).toHaveBeenCalledWith(serverChannels);
      expect(subscriptionHandler.getConfirmedChannels()).toEqual(
        serverChannels
      );
    });

    it('should handle server confirming additional channels', () => {
      const requestedChannels = ['general', 'random'];
      const serverChannels = ['general', 'random', 'announcements', 'dev'];

      subscriptionHandler.handleChannelConfirmation(
        requestedChannels,
        serverChannels
      );

      expect(mockOnChannelsConfirmed).toHaveBeenCalledWith(serverChannels);
      expect(subscriptionHandler.getConfirmedChannels()).toEqual(
        serverChannels
      );
    });

    it('should handle completely different channels from server', () => {
      const requestedChannels = ['channel1', 'channel2'];
      const serverChannels = ['channel3', 'channel4'];

      subscriptionHandler.handleChannelConfirmation(
        requestedChannels,
        serverChannels
      );

      expect(mockOnChannelsConfirmed).toHaveBeenCalledWith(serverChannels);
      expect(subscriptionHandler.getConfirmedChannels()).toEqual(
        serverChannels
      );
    });

    it('should handle empty server response', () => {
      const requestedChannels = ['general', 'random'];
      const serverChannels: string[] = [];

      subscriptionHandler.handleChannelConfirmation(
        requestedChannels,
        serverChannels
      );

      expect(mockOnChannelsConfirmed).toHaveBeenCalledWith([]);
      expect(subscriptionHandler.getConfirmedChannels()).toEqual([]);
    });

    it('should handle empty request with server channels', () => {
      const requestedChannels: string[] = [];
      const serverChannels = ['general', 'announcements'];

      subscriptionHandler.handleChannelConfirmation(
        requestedChannels,
        serverChannels
      );

      expect(mockOnChannelsConfirmed).toHaveBeenCalledWith(serverChannels);
      expect(subscriptionHandler.getConfirmedChannels()).toEqual(
        serverChannels
      );
    });
  });

  describe('isChannelConfirmed', () => {
    beforeEach(() => {
      const requestedChannels = ['general', 'random'];
      const serverChannels = ['general', 'random', 'dev'];
      subscriptionHandler.handleChannelConfirmation(
        requestedChannels,
        serverChannels
      );
    });

    it('should return true for confirmed channels', () => {
      expect(subscriptionHandler.isChannelConfirmed('general')).toBe(true);
      expect(subscriptionHandler.isChannelConfirmed('random')).toBe(true);
      expect(subscriptionHandler.isChannelConfirmed('dev')).toBe(true);
    });

    it('should return false for non-confirmed channels', () => {
      expect(subscriptionHandler.isChannelConfirmed('private')).toBe(false);
      expect(subscriptionHandler.isChannelConfirmed('announcements')).toBe(
        false
      );
    });

    it('should return false before any confirmation', () => {
      const newHandler = new SubscriptionHandler(jest.fn());
      expect(newHandler.isChannelConfirmed('general')).toBe(false);
    });
  });

  describe('getConfirmedChannels', () => {
    it('should return empty array initially', () => {
      expect(subscriptionHandler.getConfirmedChannels()).toEqual([]);
    });

    it('should return confirmed channels after confirmation', () => {
      const serverChannels = ['general', 'random', 'dev'];
      subscriptionHandler.handleChannelConfirmation([], serverChannels);

      expect(subscriptionHandler.getConfirmedChannels()).toEqual(
        serverChannels
      );
    });

    it('should return a copy of confirmed channels (immutable)', () => {
      const serverChannels = ['general', 'random'];
      subscriptionHandler.handleChannelConfirmation([], serverChannels);

      const confirmed = subscriptionHandler.getConfirmedChannels();
      confirmed.push('modified');

      expect(subscriptionHandler.getConfirmedChannels()).toEqual([
        'general',
        'random',
      ]);
    });
  });

  describe('reset', () => {
    it('should clear confirmed channels', () => {
      const serverChannels = ['general', 'random'];
      subscriptionHandler.handleChannelConfirmation([], serverChannels);

      expect(subscriptionHandler.getConfirmedChannels()).toEqual(
        serverChannels
      );

      subscriptionHandler.reset();

      expect(subscriptionHandler.getConfirmedChannels()).toEqual([]);
      expect(subscriptionHandler.isChannelConfirmed('general')).toBe(false);
    });

    it('should be safe to call multiple times', () => {
      subscriptionHandler.reset();
      subscriptionHandler.reset();

      expect(subscriptionHandler.getConfirmedChannels()).toEqual([]);
    });
  });

  describe('multiple confirmations', () => {
    it('should update channels on subsequent confirmations', () => {
      // First confirmation
      subscriptionHandler.handleChannelConfirmation(
        ['general'],
        ['general', 'random']
      );
      expect(subscriptionHandler.getConfirmedChannels()).toEqual([
        'general',
        'random',
      ]);

      // Second confirmation overwrites first
      subscriptionHandler.handleChannelConfirmation(
        ['dev'],
        ['dev', 'private']
      );
      expect(subscriptionHandler.getConfirmedChannels()).toEqual([
        'dev',
        'private',
      ]);

      expect(subscriptionHandler.isChannelConfirmed('general')).toBe(false);
      expect(subscriptionHandler.isChannelConfirmed('dev')).toBe(true);
    });
  });
});
