import User from './User';

class Server {
    public name: string;
    public ip: string;
    public port: number;
    public users: User[];

    constructor(name:string, ip:string, port:number) {
        this.name = name;
        this.ip = ip;
        this.port = port;
        this.users = [];
    }

    public updateUsers(users: User[]) {
        this.users = users;
    }
}

export default Server;
