import { ServerInfo } from './ServerInfo';

class ServerConnection {
  private info: ServerInfo;

  constructor(info: ServerInfo) {
    this.info = info;
  }

  public getInfo(): ServerInfo {
    return { ...this.info };
  }

  public updateInfo(newInfo: Partial<ServerInfo>) {
    this.info = { ...this.info, ...newInfo };
  }
}

export default ServerConnection;
