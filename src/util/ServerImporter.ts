import Server from '../models/Server'

const IngestServers = ()=> {

}

const ImportServers = ()=> {
    return <Server>[
        new Server('Server', '127.0.0.1', 1234),
        new Server('Server2', 'hi there', 1),
        new Server('Server3', 'hi there', 1),
        new Server('Server4', 'hi there', 1),
        new Server('Server5', 'hi there', 1),
        new Server('Server6', 'hi there', 1),
    ];
}

export IngestServers;
export ImportServers;
