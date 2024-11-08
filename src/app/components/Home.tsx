import React from 'react';

import ServerList from './ServerList';
import Server from '../../models/Server';
import Chat from './Chat';
import UserList from './UserList';

export default function Home() {
    return (
        <div className="flex flex-row">
            <ServerList />
            <div className="flex flex-col flex-grow min-h-screen">
                <Chat />
            </div>
            <UserList />
        </div>
    );
}
