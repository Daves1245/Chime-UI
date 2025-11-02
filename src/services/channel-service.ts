import logger from '@/logger';
import { apiClient, ApiResponse } from './api-client';

const log = logger.child({ module: 'channelService' });

export interface Channel {
  id: string;
  name: string;
  server_id: string; // Changed from serverId to server_id to match API
}

export interface CreateChannelRequest {
  name: string;
  server_id: string; // Changed from serverId to server_id to match API
}

export interface UpdateChannelRequest {
  name?: string;
  server_id?: string; // Changed from serverId to server_id to match API
}

export class ChannelService {
  async getAllChannels(): Promise<ApiResponse<Channel[]>> {
    log.debug({ function: 'getAllChannels' }, 'Fetching all channels');
    const result = await apiClient.get<Channel[]>('/channels');

    if (result.error) {
      log.error(
        { function: 'getAllChannels', error: result.error },
        'Failed to fetch all channels'
      );
    } else {
      log.info(
        { function: 'getAllChannels', count: result.data?.length },
        'Successfully fetched all channels'
      );
    }

    return result;
  }

  async getChannelsByServer(serverId: string): Promise<ApiResponse<Channel[]>> {
    log.debug(
      { function: 'getChannelsByServer', serverId },
      'Fetching channels by server'
    );
    const result = await apiClient.get<Channel[]>(
      `/channels/server/${serverId}`
    );

    if (result.error) {
      log.error(
        { function: 'getChannelsByServer', serverId, error: result.error },
        'Failed to fetch channels by server'
      );
    } else {
      log.info(
        {
          function: 'getChannelsByServer',
          serverId,
          count: result.data?.length,
        },
        'Successfully fetched channels by server'
      );
    }

    return result;
  }

  async getChannelById(id: string): Promise<ApiResponse<Channel>> {
    log.debug(
      { function: 'getChannelById', channelId: id },
      'Fetching channel by ID'
    );
    const result = await apiClient.get<Channel>(`/channels/${id}`);

    if (result.error) {
      log.error(
        { function: 'getChannelById', channelId: id, error: result.error },
        'Failed to fetch channel by ID'
      );
    } else {
      log.info(
        {
          function: 'getChannelById',
          channelId: id,
          channelName: result.data?.name,
        },
        'Successfully fetched channel by ID'
      );
    }

    return result;
  }

  async createChannel(
    channelData: CreateChannelRequest
  ): Promise<ApiResponse<Channel>> {
    log.debug(
      {
        function: 'createChannel',
        channelName: channelData.name,
        serverId: channelData.server_id,
      },
      'Creating new channel'
    );
    const result = await apiClient.post<Channel>('/channels', channelData);

    if (result.error) {
      log.error(
        { function: 'createChannel', channelData, error: result.error },
        'Failed to create channel'
      );
    } else {
      log.info(
        {
          function: 'createChannel',
          channelId: result.data?.id,
          channelName: result.data?.name,
        },
        'Successfully created channel'
      );
    }

    return result;
  }

  async updateChannel(
    id: string,
    channelData: UpdateChannelRequest
  ): Promise<ApiResponse<Channel>> {
    log.debug(
      { function: 'updateChannel', channelId: id, updateData: channelData },
      'Updating channel'
    );
    const result = await apiClient.put<Channel>(`/channels/${id}`, channelData);

    if (result.error) {
      log.error(
        { function: 'updateChannel', channelId: id, error: result.error },
        'Failed to update channel'
      );
    } else {
      log.info(
        {
          function: 'updateChannel',
          channelId: id,
          channelName: result.data?.name,
        },
        'Successfully updated channel'
      );
    }

    return result;
  }

  async deleteChannel(id: string): Promise<ApiResponse<void>> {
    log.debug({ function: 'deleteChannel', channelId: id }, 'Deleting channel');
    const result = await apiClient.delete<void>(`/channels/${id}`);

    if (result.error) {
      log.error(
        { function: 'deleteChannel', channelId: id, error: result.error },
        'Failed to delete channel'
      );
    } else {
      log.info(
        { function: 'deleteChannel', channelId: id },
        'Successfully deleted channel'
      );
    }

    return result;
  }
}

export const channelService = new ChannelService();
