import { z } from 'zod';
import { load } from 'js-toml';

// Define the expected structure of the TOML data
interface TomlData {
  api: {
    host: string;
    port: number;
  };
  chat: {
    port: number;
    wsUrl: string;
  };
  redis: {
    host: string;
    port: number;
    username: string;
    password: string;
    test: {
      host: string;
      port: number;
      password: string;
    };
  };
  cassandra: {
    host: string;
    port: number;
  };
}

const CredentialsSchema = z.object({
  api: z.object({
    host: z.string(),
    port: z.number(),
  }),
  chat: z.object({
    port: z.number(),
    wsUrl: z.string(),
  }),
  redis: z.object({
    host: z.string(),
    port: z.number(),
    username: z.string(),
    password: z.string(),
    test: z.object({
      host: z.string(),
      port: z.number(),
      password: z.string(),
    }),
  }),
  cassandra: z.object({
    host: z.string(),
    port: z.number(),
  }),
});

export type Credentials = z.infer<typeof CredentialsSchema>;

export async function loadCredentials(): Promise<Credentials> {
  console.log('Loading credentials...');

  try {
    // Check if we're in Electron environment
    const isElectron = (() => {
      try {
        if (typeof window !== 'undefined') {
          const windowWithProcess = window as unknown as { process?: { type?: string } };
          if (windowWithProcess.process?.type === 'renderer') {
            return true;
          }
        }
        return false;
      } catch {
        return false;
      }
    })();
    
    let fileContent: string;
    
    if (isElectron) {
      // In Electron, use the exposed API from preload script
      const electronAPI = (window as unknown as { electronAPI?: { loadCredentials: () => Promise<string> } }).electronAPI;
      if (!electronAPI) {
        throw new Error('Electron API not available');
      }
      fileContent = await electronAPI.loadCredentials();
    } else if (typeof window === 'undefined') {
      // Server-side Node.js environment
      const fs = await import('fs');
      fileContent = fs.readFileSync('./credentials/credentials.toml', 'utf8');
    } else {
      // Browser environment - credentials should come from API
      throw new Error('Credentials loading not available in browser environment');
    }
    
    const data = load(fileContent) as TomlData;

    const credentials = CredentialsSchema.parse({
      api: {
        host: data.api.host,
        port: data.api.port,
      },
      chat: {
        port: data.chat.port,
        wsUrl: data.chat.wsUrl,
      },
      redis: {
        host: data.redis.host,
        port: data.redis.port,
        username: data.redis.username,
        password: data.redis.password,
        test: {
          host: data.redis.test.host,
          port: data.redis.test.port,
          password: data.redis.test.password,
        },
      },
      cassandra: {
        host: data.cassandra.host,
        port: data.cassandra.port,
      },
    });

    console.log('Credentials loaded and validated successfully');
    return credentials;
  } catch (error) {
    console.error('Failed to validate credentials:', error);
    throw new Error(
      `Failed to load credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
