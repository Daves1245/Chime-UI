import { Message } from '@/types/Message';

/**
 * WebSocket client state
 */
export interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  userId: string | null;
  channels: string[];
  connectionPromise: Promise<void> | null;
}

/**
 * Event handlers for WebSocket client
 */
export interface WebSocketEventHandlers {
  onMessage?: (message: Message) => void;
  onConnected?: (userId: string, channels: string[]) => void;
  onError?: (error: string) => void;
  onDisconnected?: () => void;
  onChannelsUpdated?: (channels: string[]) => void;
}

/**
 * WebSocket client configuration
 */
export interface WebSocketClientConfig {
  serverUrl: string;
  connectionTimeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Connection response data extracted from server messages
 */
export interface ConnectionData {
  userId: string;
  channels: string[];
}
