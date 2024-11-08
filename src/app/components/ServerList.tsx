"use client";

import React, { useState } from 'react';
import Server from '../../models/Server';
import ServerIcon from './ServerIcon';

const ServerList = (serverList) => {
    const [items, setItems] = useState([
        new Server('Server', '127.0.0.1', 1234),
        new Server('Server2', 'hi there', 1),
        new Server('Server3', 'hi there', 1),
        new Server('Server4', 'hi there', 1),
        new Server('Server5', 'hi there', 1),
        new Server('Server6', 'hi there', 1),
    ])

    return (
        <div className="w-[20%] bg-black">
            {items.map((server, index) => (
                <ServerIcon key={index} instance={server} />
            ))}
        </div>
    );
}

export default ServerList;
