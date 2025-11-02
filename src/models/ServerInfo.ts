export interface ServerInfo {
  name: string;
  ip: string;
  port: number;
  iconUrl?: string;
}

// Default values for a new server
export const defaultServerInfo: ServerInfo = {
  name: '',
  ip: '127.0.0.1',
  port: 8080,
};

// Type-guard to validate server info
export function isValidServerInfo(
  info: Partial<ServerInfo>
): info is ServerInfo {
  return (
    typeof info.name === 'string' &&
    info.name.length > 0 &&
    typeof info.ip === 'string' &&
    info.ip.length > 0 &&
    typeof info.port === 'number' &&
    info.port > 0 &&
    info.port < 65536
  );
}

// Helper to validate individual fields
export const validateServerField = {
  name: (name: string) => name.length > 0,
  ip: (ip: string) => /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip),
  port: (port: number) => port > 0 && port < 65536,
};
