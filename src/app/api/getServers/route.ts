import { NextResponse } from 'next/server';
import Server from '../../../models/Server';
import User from '../../../models/User';

// Helper function to generate random handles
const generateRandomHandle = () => {
  const handles = [
    'Alice',
    'Bob',
    'Charlie',
    'David',
    'Eva',
    'Frank',
    'Grace',
    'Hannah',
    'Ian',
    'Jack',
  ];
  const randomIndex = Math.floor(Math.random() * handles.length);
  return handles[randomIndex];
};

// Helper function to generate random IDs (for simplicity, using a timestamp)
const generateRandomId = () => {
  return `user-${Math.floor(Math.random() * 10000)}`;
};

// Example random user generation function
const generateRandomUsers = (numUsers: number) => {
  const users = [];
  for (let i = 0; i < numUsers; i++) {
    const handle = generateRandomHandle();
    const id = generateRandomId();
    const user = new User(handle, id, '/pfp.png'); // Add default profile picture
    users.push(user);
  }
  return users;
};

// Default channels that each server will have
const defaultChannels = [
  'general',
  'memes',
  'music',
  'games',
  'announcements',
  'off-topic',
  'coding',
  'random',
];

export const dynamic = 'force-static';

export async function GET() {
  try {
    // Mock servers data
    const servers = [
      new Server('Server1', '127.0.0.1', 1234, '/icon.png'),
      new Server('Server2', '192.168.1.1', 5678, '/icon.png'),
      new Server('Server3', '10.0.0.1', 9101, '/icon.png'),
      new Server('Server4', '172.16.0.1', 1122, '/icon.png'),
      new Server('Server5', '192.168.100.1', 3344, '/icon.png'),
      new Server('Server6', '10.0.1.1', 5566, '/icon.png'),
    ];

    // Generate 5 random users and add default channels for each server
    servers.forEach(server => {
      const randomUsers = generateRandomUsers(5);
      server.updateUsers(randomUsers);
      // Each server gets all default channels
      server.updateChannels(defaultChannels);
    });

    console.log('[getServers]: Returning servers: ', servers);

    // Return the updated servers
    return NextResponse.json({ servers: servers }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log('Error: ', error.message);
      return NextResponse.json(
        { message: 'Failed to fetch servers', error: error.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { message: 'Unknown error occurred', error: String(error) },
        { status: 500 }
      );
    }
  }
}
