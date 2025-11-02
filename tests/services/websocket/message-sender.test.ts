import { MessageSender } from '@/services/websocket/MessageSender';
import { ConnectionManager } from '@/services/websocket/ConnectionManager';
import { SubscriptionHandler } from '@/services/websocket/SubscriptionHandler';
import { Message } from '@/types/Message';

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

describe('MessageSender', () => {
    let messageSender: MessageSender;
    let mockConnectionManager: jest.Mocked<ConnectionManager>;
    let mockSubscriptionHandler: jest.Mocked<SubscriptionHandler>;

    beforeEach(() => {
        // Mock ConnectionManager
        mockConnectionManager: typeof ConnectionManager = {
            send: jest.fn(),
            connect: jest.fn(),
            disconnect: jest.fn(),
            isConnected: jest.fn(),
            getState: jest.fn()
        };

        // Mock SubscriptionHandler
        mockSubscriptionHandler = {
            handleChannelConfirmation: jest.fn(),
            getConfirmedChannels: jest.fn(),
            isChannelConfirmed: jest.fn(),
            reset: jest.fn()
        } as any;

        messageSender = new MessageSender(mockConnectionManager, mockSubscriptionHandler);
    });

    describe('sendMessage', () => {
        it('should serialize and send message through connection manager', () => {
            const message: Message = {
                type: 'connect',
                config: { channels: ['general'] }
            };

            messageSender.sendMessage(message);

            expect(mockConnectionManager.send).toHaveBeenCalledWith(JSON.stringify(message));
        });

        it('should handle different message types', () => {
            const chatMessage: Message = {
                type: 'message',
                message: {
                    channelId: 'general',
                    messageId: '123',
                    userId: 'user1',
                    content: 'Hello',
                    createdAt: '2023-01-01T00:00:00Z',
                    editedAt: null,
                    metadata: {}
                }
            };

            messageSender.sendMessage(chatMessage);

            expect(mockConnectionManager.send).toHaveBeenCalledWith(JSON.stringify(chatMessage));
        });
    });

    describe('sendChatMessage', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2023-01-01T12:00:00Z'));
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should create and send a chat message', () => {
            const channelId = 'general';
            const content = 'Hello, world!';

            messageSender.sendChatMessage(channelId, content);

            expect(mockConnectionManager.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'message',
                    message: {
                        channelId,
                        messageId: '',
                        userId: '',
                        content,
                        createdAt: '2023-01-01T12:00:00.000Z',
                        editedAt: null,
                        metadata: {}
                    }
                })
            );
        });

        it('should handle empty content', () => {
            messageSender.sendChatMessage('general', '');

            expect(mockConnectionManager.send).toHaveBeenCalledWith(
                expect.stringContaining('"content":""')
            );
        });

        it('should handle special characters in content', () => {
            const specialContent = 'Hello! 🎉 "quoted" & <html>';
            
            messageSender.sendChatMessage('general', specialContent);

            const sentData = mockConnectionManager.send.mock.calls[0][0];
            const parsedMessage = JSON.parse(sentData);
            expect(parsedMessage.message.content).toBe(specialContent);
        });

        it('should set messageId and userId as empty strings for server to populate', () => {
            messageSender.sendChatMessage('test-channel', 'test message');

            const sentData = mockConnectionManager.send.mock.calls[0][0];
            const parsedMessage = JSON.parse(sentData);
            
            expect(parsedMessage.message.messageId).toBe('');
            expect(parsedMessage.message.userId).toBe('');
        });
    });

    describe('sendHandshake', () => {
        it('should send handshake with user channels', () => {
            const userChannels = ['general', 'random', 'dev'];

            messageSender.sendHandshake(userChannels);

            expect(mockConnectionManager.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'connect',
                    config: { channels: userChannels }
                })
            );
        });

        it('should handle empty channels array', () => {
            messageSender.sendHandshake([]);

            expect(mockConnectionManager.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'connect',
                    config: { channels: [] }
                })
            );
        });

        it('should handle single channel', () => {
            messageSender.sendHandshake(['general']);

            expect(mockConnectionManager.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'connect',
                    config: { channels: ['general'] }
                })
            );
        });
    });

    describe('getConfirmedChannels', () => {
        it('should delegate to subscription handler', () => {
            const mockChannels = ['general', 'random'];
            mockSubscriptionHandler.getConfirmedChannels.mockReturnValue(mockChannels);

            const result = messageSender.getConfirmedChannels();

            expect(mockSubscriptionHandler.getConfirmedChannels).toHaveBeenCalled();
            expect(result).toBe(mockChannels);
        });

        it('should return empty array when no channels confirmed', () => {
            mockSubscriptionHandler.getConfirmedChannels.mockReturnValue([]);

            const result = messageSender.getConfirmedChannels();

            expect(result).toEqual([]);
        });
    });

    describe('error scenarios', () => {
        it('should propagate connection manager errors', () => {
            const error = new Error('Connection failed');
            mockConnectionManager.send.mockImplementation(() => {
                throw error;
            });

            expect(() => {
                messageSender.sendMessage({
                    type: 'connect',
                    config: { channels: ['general'] }
                });
            }).toThrow('Connection failed');
        });

        it('should handle JSON serialization edge cases', () => {
            // This tests that our message structure is always serializable
            const messageWithComplexData: Message = {
                type: 'message',
                message: {
                    channelId: 'test',
                    messageId: '123',
                    userId: 'user1',
                    content: 'Test message',
                    createdAt: new Date().toISOString(),
                    editedAt: null,
                    metadata: {
                        nested: { value: 'test' },
                        array: [1, 2, 3],
                        nullValue: null
                    }
                }
            };

            expect(() => {
                messageSender.sendMessage(messageWithComplexData);
            }).not.toThrow();

            expect(mockConnectionManager.send).toHaveBeenCalledWith(
                expect.stringMatching(/^{.*}$/) // Valid JSON string
            );
        });
    });

    describe('integration scenarios', () => {
        it('should work with subscription handler for channel validation flow', () => {
            // Setup confirmed channels
            mockSubscriptionHandler.getConfirmedChannels.mockReturnValue(['general', 'random']);

            // Send handshake
            messageSender.sendHandshake(['general', 'random', 'dev']);

            // Send chat message
            messageSender.sendChatMessage('general', 'Hello');

            // Get confirmed channels
            const confirmed = messageSender.getConfirmedChannels();

            expect(mockConnectionManager.send).toHaveBeenCalledTimes(2); // handshake + chat
            expect(confirmed).toEqual(['general', 'random']);
        });
    });
});
