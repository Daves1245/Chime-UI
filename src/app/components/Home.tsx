import React from 'react';

import ServerList from './ServerList';
import Chat from './Chat';
import UserList from './UserList';

export default function Home() {
    return (
        <div>
            <ServerList />
            <Chat />
            <UserList />
        </div>
    );
}
