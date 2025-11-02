# Chime API Integration

This directory contains the API service layer for interfacing with the Chime backend server running on `localhost:3141`.

## Structure

- **`api-client.ts`** - Core HTTP client with error handling and response formatting
- **`user-service.ts`** - User management operations (CRUD)
- **`server-service.ts`** - Server management operations (CRUD)
- **`channel-service.ts`** - Channel management operations (CRUD)
- **`message-service.ts`** - Message operations (get, send)
- **`api-service.ts`** - Main export file combining all services

## Usage

### Basic Usage

```typescript
import { apiService } from '../services/api-service';

// Get all servers
const response = await apiService.servers.getAllServers();
if (response.data) {
  console.log('Servers:', response.data);
} else if (response.error) {
  console.error('Error:', response.error);
}
```

### Using Individual Services

```typescript
import {
  userService,
  serverService,
  messageService,
} from '../services/api-service';

// Create a new user
const newUser = await userService.createUser({
  handle: 'john_doe',
  profilePicture: '/path/to/image.png',
});

// Send a message
const message = await messageService.sendMessage({
  text: 'Hello, world!',
  channelId: 'general',
  userId: 'user-123',
});
```

### Error Handling

All API calls return a standardized `ApiResponse<T>` format:

```typescript
interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}
```

### Using the useApi Hook

For React components, use the `useApi` hook for automatic loading states:

```typescript
import { useApi } from '../hooks/useApi';
import { serverService } from '../services/api-service';

function MyComponent() {
  const { data: servers, loading, error, refetch } = useApi(
    () => serverService.getAllServers(),
    [] // dependencies
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {servers?.map(server => (
        <div key={server.name}>{server.name}</div>
      ))}
    </div>
  );
}
```

## API Endpoints

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Servers

- `GET /api/servers` - Get all servers
- `GET /api/servers/:id` - Get server by ID
- `POST /api/servers` - Create new server
- `PUT /api/servers/:id` - Update server
- `DELETE /api/servers/:id` - Delete server

### Channels

- `GET /api/channels` - Get all channels
- `GET /api/channels/server/:serverId` - Get channels by server
- `GET /api/channels/:id` - Get channel by ID
- `POST /api/channels` - Create new channel
- `PUT /api/channels/:id` - Update channel
- `DELETE /api/channels/:id` - Delete channel

### Messages

- `GET /api/messages/:channel` - Get messages for a channel
- `POST /api/messages/send` - Send a new message

## Configuration

The API base URL is configured in `api-client.ts`:

```typescript
const API_BASE_URL = 'http://localhost:3141/api';
```

To change the backend server URL, modify this constant.

## Fallback Behavior

All components include fallback behavior when the API is unavailable:

- ServerList falls back to mock data
- Chat falls back to local message storage
- ChannelList falls back to server's local channels

This ensures the UI remains functional even when the backend is not running.
