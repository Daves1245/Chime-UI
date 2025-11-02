import React, { FC, useEffect, useState } from 'react';
import Server from '@/models/Server';
import { channelService, Channel } from '@/services/api-service';

interface ChannelListProps {
  server: Server;
  selectedChannel: string | null;
  onChannelSelect: (channel: string) => void;
}

const ChannelList: FC<ChannelListProps> = ({
  server,
  selectedChannel,
  onChannelSelect,
}) => {
  const [channels, setChannels] = useState<string[]>(server.channels);

  // Load channels from API when server changes
  useEffect(() => {
    const loadChannels = async () => {
      try {
        // Use the actual server ID instead of deriving it from name
        if (!server.id) {
          console.warn('Server has no ID, falling back to local channels');
          setChannels(server.channels);
          return;
        }

        const response = await channelService.getChannelsByServer(server.id);

        if (response.data) {
          const channelNames = response.data.map(
            (channel: Channel) => channel.name
          );
          setChannels(channelNames);
        } else if (response.error) {
          console.error('Failed to load channels:', response.error);
          // Fallback to server's local channels
          setChannels(server.channels);
        }
      } catch (error) {
        console.error('Failed to load channels:', error);
        // Fallback to server's local channels
        setChannels(server.channels);
      }
    };

    loadChannels();
  }, [server]);

  return (
    <div className="w-full h-full bg-background">
      <div className="h-[3em] flex flex-row justify-between items-center border-b border-border-highlight bg-box-background">
        <div className="w-[10%] h-full"></div>
        <div className="h-auto w-full select-none flex items-center font-semibold">
          {server.name}
        </div>
      </div>
      <div className="p-4">
        {channels.map((channel, index) => (
          <div
            key={index}
            className={`px-2 py-1 select-none mb-1 rounded cursor-pointer transition-colors ${
              channel === selectedChannel
                ? 'bg-box-highlight text-white'
                : 'text-gray-300 hover:bg-box-highlight hover:text-white'
            }`}
            onClick={() => onChannelSelect(channel)}
          >
            # {channel}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChannelList;
