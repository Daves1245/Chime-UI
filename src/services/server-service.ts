import logger from '@/logger';
import { apiClient, ApiResponse } from './api-client';

const log = logger.child({ module: 'serverService' });

export interface ServerApiResponse {
  id: string;
  name: string;
  ip: string;
  port: number;
  iconUrl?: string;
  users: string[];
  channels: string[];
}

export interface CreateServerRequest {
  name: string;
  ip: string;
  port: number;
  iconUrl?: string;
}

export interface UpdateServerRequest {
  name?: string;
  ip?: string;
  port?: number;
  iconUrl?: string;
}

export class ServerService {
  async getAllServers(): Promise<ApiResponse<ServerApiResponse[]>> {
    log.debug({ function: 'getAllServers' }, 'Fetching all servers');
    const result = await apiClient.get<ServerApiResponse[]>('/servers');

    if (result.error) {
      log.error(
        { function: 'getAllServers', error: result.error },
        'Failed to fetch all servers'
      );
    } else {
      log.info(
        { function: 'getAllServers', count: result.data?.length },
        'Successfully fetched all servers'
      );
    }

    return result;
  }

  async getServerById(id: string): Promise<ApiResponse<ServerApiResponse>> {
    log.debug(
      { function: 'getServerById', serverId: id },
      'Fetching server by ID'
    );
    const result = await apiClient.get<ServerApiResponse>(`/servers/${id}`);

    if (result.error) {
      log.error(
        { function: 'getServerById', serverId: id, error: result.error },
        'Failed to fetch server by ID'
      );
    } else {
      log.info(
        {
          function: 'getServerById',
          serverId: id,
          serverName: result.data?.name,
        },
        'Successfully fetched server by ID'
      );
    }

    return result;
  }

  async createServer(
    serverData: CreateServerRequest
  ): Promise<ApiResponse<ServerApiResponse>> {
    log.debug(
      {
        function: 'createServer',
        serverName: serverData.name,
        ip: serverData.ip,
        port: serverData.port,
      },
      'Creating new server'
    );

    const result = await apiClient.post<ServerApiResponse>(
      '/servers',
      serverData
    );

    if (result.error) {
      log.error(
        { function: 'createServer', serverData, error: result.error },
        'Failed to create server'
      );
    } else {
      log.info(
        {
          function: 'createServer',
          serverId: result.data?.id,
          serverName: result.data?.name,
          ip: result.data?.ip,
          port: result.data?.port,
        },
        'Successfully created server'
      );
    }

    return result;
  }

  async updateServer(
    id: string,
    serverData: UpdateServerRequest
  ): Promise<ApiResponse<ServerApiResponse>> {
    log.debug(
      { function: 'updateServer', serverId: id, updateData: serverData },
      'Updating server'
    );
    const result = await apiClient.put<ServerApiResponse>(
      `/servers/${id}`,
      serverData
    );

    if (result.error) {
      log.error(
        { function: 'updateServer', serverId: id, error: result.error },
        'Failed to update server'
      );
    } else {
      log.info(
        {
          function: 'updateServer',
          serverId: id,
          serverName: result.data?.name,
        },
        'Successfully updated server'
      );
    }

    return result;
  }

  async deleteServer(id: string): Promise<ApiResponse<void>> {
    log.debug({ function: 'deleteServer', serverId: id }, 'Deleting server');
    const result = await apiClient.delete<void>(`/servers/${id}`);

    if (result.error) {
      log.error(
        { function: 'deleteServer', serverId: id, error: result.error },
        'Failed to delete server'
      );
    } else {
      log.info(
        { function: 'deleteServer', serverId: id },
        'Successfully deleted server'
      );
    }

    return result;
  }
}

export const serverService = new ServerService();
