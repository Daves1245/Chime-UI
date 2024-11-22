"use client";

import React, { useState } from 'react';
import Server from '../../models/Server';
import ServerIcon from './ServerIcon';

interface ServerListProps {
    servers: Server[];
    onServerSelect: (server: Server) => void;
}

const ServerList: React.FC<ServerListProps> = ({servers, onServerSelect}) => {
    return (
        <div className="w-[20%] bg-black">
            {servers.map((server: Server, index) => (
                <ServerIcon key={index} instance={server} onServerSelect={onServerSelect}/>
            ))}
        </div>
    );
}

export default ServerList;
