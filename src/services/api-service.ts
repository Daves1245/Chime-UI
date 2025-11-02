export { apiClient } from './api-client';
export { userService, UserService } from './user-service';
export { serverService, ServerService } from './server-service';
export { channelService, ChannelService } from './channel-service';
export { messageService, MessageService } from './message-service';

export type { ApiResponse } from './api-client';
export type { CreateUserRequest, UpdateUserRequest } from './user-service';
export type {
  CreateServerRequest,
  UpdateServerRequest,
  ServerApiResponse,
} from './server-service';
export type {
  Channel,
  CreateChannelRequest,
  UpdateChannelRequest,
} from './channel-service';
export type {
  Message,
  SendMessageRequest,
  MessagesResponse,
} from './message-service';

import { userService } from './user-service';
import { serverService } from './server-service';
import { channelService } from './channel-service';
import { messageService } from './message-service';

// Main API service class that combines all services
export class ApiService {
  constructor(
    public users = userService,
    public servers = serverService,
    public channels = channelService,
    public messages = messageService
  ) {}
}

export const apiService = new ApiService();
