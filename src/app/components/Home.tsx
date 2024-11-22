"use client";

import React, { useState, useEffect } from 'react';

import Server from '../../models/Server'
import ServerList from './ServerList';
import Chat from './Chat';
import UserList from './UserList';

export default function Home() {

    const [selectedServer, setSelectedServer] = useState<Server | null>(null);
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const handleServerSelect = (server: Server)=> {
        setSelectedServer(server);
    }

    useEffect(() => {
        const fetchServers = async ()=> {
            try {
                const response = await fetch('/api/getServers');
                if (!response.ok) {
                    throw new Error('Failed to fetch servers');
                }
                const data = await response.json();
                setServers(data.servers);
                setLoading(false);
            } catch (e: unknown) {
                if (e instanceof Error) {
                    console.log('[fetchServers]: ', e.message);
                    setError('Error fetching servers: {e.message}');
                } else {
                    console.log('Unknown error caught when fetching servers');
                    setError('Unknown error');
                }
            }

        }
        fetchServers();

        // cleanup code
        return () => {

        };
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="flex flex-row">
            <ServerList servers={servers} onServerSelect={handleServerSelect} />
            <div className="flex flex-col flex-grow min-h-screen">
                {/* Only render the Chat component if a server is selected */}
        {selectedServer ? (
            <Chat server={selectedServer} />
            ) : (
                <div>Select a server to view the chat</div>
            )}
        </div>
        <UserList />
    </div>
    );
}
