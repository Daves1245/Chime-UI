'use client';

import React, { useState } from 'react';
import Server from '@/models/Server';
import Image from 'next/image';

interface ServerIconProps {
  instance: Server;
  onServerSelect: (server: Server) => void;
}

const DEFAULT = '#4A90E2';
const HOVER = '#2E609B';
const CLICKED = '#3A78C2';

const ServerIcon: React.FC<ServerIconProps> = ({
  instance,
  onServerSelect,
}) => {
  const [color, setColor] = useState(DEFAULT);
  const [imageError, setImageError] = useState(false);

  const onMouseDown = () => {
    setColor(CLICKED);
  };

  const onMouseUp = () => {
    setColor(HOVER);
    onServerSelect(instance);
  };

  return (
    <div className="p-2 w-[4em] h-[4em]">
      {instance && (
        <div
          onMouseOver={() => {
            setColor(HOVER);
          }}
          onMouseLeave={() => {
            setColor(DEFAULT);
          }}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          className={`h-full w-full rounded-full grid place-items-center select-none cursor-pointer transition-colors overflow-hidden`}
          style={{ backgroundColor: color }}
        >
          {instance.iconUrl && !imageError ? (
            <div className="relative w-full h-full">
              <Image
                src={instance.iconUrl}
                alt={`${instance.name} icon`}
                fill
                sizes="4em"
                className="object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <p>{instance.name}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ServerIcon;
