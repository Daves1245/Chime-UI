import User from './User';

class Server {
  public id?: string; // Add id field to match API
  public name: string;
  public ip: string;
  public port: number;
  public users: User[];
  public iconUrl?: string;
  public channels: string[];

  constructor(
    name: string,
    ip: string,
    port: number,
    iconUrl?: string,
    id?: string
  ) {
    this.id = id;
    this.name = name;
    this.ip = ip;
    this.port = port;
    this.users = [];
    this.iconUrl = iconUrl;
    this.channels = [];
  }

  public updateUsers(users: User[]) {
    this.users = users;
  }

  public updateChannels(channels: string[]) {
    this.channels = channels;
  }
}

export default Server;
