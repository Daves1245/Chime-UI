'use client';

import React, { useState, useEffect } from 'react';

import Server from '@/models/Server';
import ServerList from './ServerList';
import Chat from './Chat';
import ChannelList from './ChannelList';

export default function Home() {
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleServerSelect = (server: Server) => {
    setSelectedServer(server);
    console.log("Selected server: ", server);
    console.log("Channels in server: ", server.channels);
    // Reset channel selection when switching servers
    setSelectedChannel(server.channels[0] || null);
  };

  const handleChannelSelect = (channel: string) => {
    setSelectedChannel(channel);
  };

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await fetch('/api/getServers');
        if (!response.ok) {
          throw new Error('Failed to fetch servers');
        }
        const data = await response.json();
        const servers = data.servers as Server[];
        console.log(`Fetched servers: ${JSON.stringify(servers)}`);
        setServers(servers);
        if (data.servers.length > 0) {
          setSelectedServer(servers[0]);
          if (servers[0].channels.length > 0) {
            setSelectedChannel(servers[0].channels[0]);
          }
        }
        setLoading(false);
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.log('[fetchServers]: ', e.message);
          setError(`Error fetching servers: ${e.message}`);
        } else {
          console.log('Unknown error caught when fetching servers');
          setError('Unknown error');
        }
      }
    };
    fetchServers();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="flex flex-row w-screen h-screen">
      <div className="w-max-w flex-shrink-0">
        <ServerList servers={servers} onServerSelect={handleServerSelect} />
      </div>

      <div className="w-[15%] flex-shrink-0 min-h-screen">
        {selectedServer ? (
          <>
            <ChannelList
              server={selectedServer}
              selectedChannel={selectedChannel}
              onChannelSelect={handleChannelSelect}
            />
          </>
        ) : (
          <></>
        )}
      </div>

      <div className="flex-grow min-h-screen max-h-screen">
        {selectedServer && selectedChannel ? (
          <>
            <Chat
              key={selectedServer.id}
              server={selectedServer}
              channel={selectedChannel}
            />
          </>
        ) : (
          <div>Select a server and channel to view the chat</div>
        )}
      </div>
    </div>
  );
}
