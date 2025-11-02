import logger from '@/logger';
import { apiClient, ApiResponse } from './api-client';
import User from '@/models/User';

const log = logger.child({ module: 'userService' });

export interface CreateUserRequest {
  handle: string;
  profilePicture?: string;
}

export interface UpdateUserRequest {
  handle?: string;
  profilePicture?: string;
}

export class UserService {
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    log.debug({ function: 'getAllUsers' }, 'Fetching all users');
    const result = await apiClient.get<User[]>('/users');

    if (result.error) {
      log.error(
        { function: 'getAllUsers', error: result.error },
        'Failed to fetch all users'
      );
    } else {
      log.info(
        { function: 'getAllUsers', count: result.data?.length },
        'Successfully fetched all users'
      );
    }

    return result;
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    log.debug({ function: 'getUserById', userId: id }, 'Fetching user by ID');
    const result = await apiClient.get<User>(`/users/${id}`);

    if (result.error) {
      log.error(
        { function: 'getUserById', userId: id, error: result.error },
        'Failed to fetch user by ID'
      );
    } else {
      log.info(
        {
          function: 'getUserById',
          userId: id,
          userHandle: result.data?.handle,
        },
        'Successfully fetched user by ID'
      );
    }

    return result;
  }

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    log.debug(
      { function: 'createUser', handle: userData.handle },
      'Creating new user'
    );
    const result = await apiClient.post<User>('/users', userData);

    if (result.error) {
      log.error(
        { function: 'createUser', userData, error: result.error },
        'Failed to create user'
      );
    } else {
      log.info(
        {
          function: 'createUser',
          userId: result.data?.id,
          handle: result.data?.handle,
        },
        'Successfully created user'
      );
    }

    return result;
  }

  async updateUser(
    id: string,
    userData: UpdateUserRequest
  ): Promise<ApiResponse<User>> {
    log.debug(
      { function: 'updateUser', userId: id, updateData: userData },
      'Updating user'
    );
    const result = await apiClient.put<User>(`/users/${id}`, userData);

    if (result.error) {
      log.error(
        { function: 'updateUser', userId: id, error: result.error },
        'Failed to update user'
      );
    } else {
      log.info(
        { function: 'updateUser', userId: id, handle: result.data?.handle },
        'Successfully updated user'
      );
    }

    return result;
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    log.debug({ function: 'deleteUser', userId: id }, 'Deleting user');
    const result = await apiClient.delete<void>(`/users/${id}`);

    if (result.error) {
      log.error(
        { function: 'deleteUser', userId: id, error: result.error },
        'Failed to delete user'
      );
    } else {
      log.info(
        { function: 'deleteUser', userId: id },
        'Successfully deleted user'
      );
    }

    return result;
  }
}

export const userService = new UserService();
