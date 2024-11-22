"use client";

import React, { useState, useEffect } from 'react';

import Server from '../../models/Server'
import ServerList from './ServerList';
import Chat from './Chat';
import UserList from './UserList';

export default function Home() {

    const [selectedServer, setSelectedServer] = useState();
    const [servers, setServers] = useState();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // grab server list from ServerImporter
        try {
            const response = await fetch('/api/getServers');
            if (!response.ok) {
                throw new Error('Failed to fetch servers');
            }

            const data = await response.json();

            setServers(data.servers);
            setLoading(false);
        } catch (e: unknown) {
            setError('Error fetching servers');
        }

        fetchServers();
        // cleanup code
        return () => {

        };
    }, []);

    return (
        <div className="flex flex-row">
            <ServerList servers={servers}/>
            <div className="flex flex-col flex-grow min-h-screen">
                <Chat server={selectedServer}/>
            </div>
            <UserList />
        </div>
    );
}
