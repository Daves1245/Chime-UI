import React, { FC } from 'react';
import Server from '@/models/Server';

interface ChannelListProps {
    server: Server;
    selectedChannel: string | null;
    onChannelSelect: (channel: string) => void;
}

const ChannelList: FC<ChannelListProps> = ({server, selectedChannel, onChannelSelect}) => {
    return (
        <div className="w-full h-full bg-background">
            <div className="h-[3em] flex flex-row justify-between items-center border-b border-border-highlight bg-box-background">
                <div className="w-[10%] h-full">
                </div>
                <div className="h-auto w-full select-none flex items-center font-semibold">
                    {server.name}
                </div>
            </div>
            <div className="p-4">
                {server.channels.map((channel, index) => (
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
}

export default ChannelList;
