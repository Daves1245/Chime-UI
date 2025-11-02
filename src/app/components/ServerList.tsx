'use client';

import React, { useState } from 'react';
import Server from '@/models/Server';
import ServerIcon from './ServerIcon';
import AddServerButton from './AddServerButton';
import AddServerForm from './AddServerForm';
import Modal from './Modal';
import { ServerInfo } from '@/models/ServerInfo';
import { serverService } from '@/services/api-service';
import { v4 as uuidv4 } from 'uuid';

interface ServerListProps {
  servers: Server[];
  onServerSelect: (server: Server) => void;
}

const ServerList: React.FC<ServerListProps> = ({
  servers: initialServers,
  onServerSelect,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [servers, setServers] = useState(initialServers);

  const handleAddServer = async (serverInfo: ServerInfo) => {
    try {
      const response = await serverService.createServer({
        name: serverInfo.name,
        ip: serverInfo.ip,
        port: serverInfo.port,
        iconUrl: serverInfo.iconUrl || '/icon.png',
      });

      if (response.data) {
        // Convert API response to Server instance
        const newServer = new Server(
          response.data.name,
          response.data.ip,
          response.data.port,
          response.data.iconUrl || '/icon.png',
          response.data.id
        );
        setServers(prev => [...prev, newServer]);
        setIsModalOpen(false);
      } else if (response.error) {
        console.error('Failed to create server:', response.error);
        // Fallback to local creation
        const newServer = new Server(
          serverInfo.name,
          serverInfo.ip,
          serverInfo.port,
          serverInfo.iconUrl || '/icon.png'
        );
        setServers(prev => [...prev, newServer]);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to create server:', error);
      // Fallback to local creation
      const newServer = new Server(
        serverInfo.name,
        serverInfo.ip,
        serverInfo.port,
        serverInfo.iconUrl || '/icon.png'
      );
      setServers(prev => [...prev, newServer]);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center w-max-w h-screen bg-black border-r border-border-highlight overflow-hidden">
        {servers.map((server: Server) => (
          <ServerIcon
            key={uuidv4()}
            instance={server}
            onServerSelect={onServerSelect}
          />
        ))}
        <AddServerButton onClick={() => setIsModalOpen(true)} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <AddServerForm
          onSubmit={handleAddServer}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
};

export default ServerList;
