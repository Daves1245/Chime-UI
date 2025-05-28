import User from './User';

class Server {
    public name: string;
    public ip: string;
    public port: number;
    public users: User[];
    public iconUrl?: string;
    public channels: string[];

    constructor(name:string, ip:string, port:number, iconUrl?: string) {
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
