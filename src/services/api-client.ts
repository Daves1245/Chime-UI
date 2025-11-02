import logger from '@/logger';

const log = logger.child({ module: 'apiClient' });

const API_BASE_URL = 'http://localhost:3142/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    log.debug({ function: 'constructor', baseUrl }, 'API client initialized');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';

    log.debug(
      { function: 'request', method, endpoint, url },
      'Making API request'
    );

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data.message || `HTTP ${response.status}`;
        log.warn(
          {
            function: 'request',
            method,
            endpoint,
            status: response.status,
            error,
          },
          'API request failed'
        );

        return {
          error,
          status: response.status,
        };
      }

      log.info(
        {
          function: 'request',
          method,
          endpoint,
          status: response.status,
        },
        'API request successful'
      );

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Network error';
      log.error(
        {
          function: 'request',
          method,
          endpoint,
          error,
        },
        'API request failed with network error'
      );

      return {
        error: errorMessage,
        status: 0,
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
