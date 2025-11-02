import React, { useState } from 'react';
import User from '@/models/User';
import Image from 'next/image';

interface UserIconProps {
  instance: User;
}

const DEFAULT = 'bg-box-background';
const HOVER = 'bg-border-highlight';

const UserIcon: React.FC<UserIconProps> = ({ instance }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className="p-2 w-full">
      {instance && (
        <div
          className={`flex items-center justify-start p-2 gap-3 transition-colors ${isHovered ? HOVER : DEFAULT}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex-shrink-0 flex-grow-0 rounded-full w-[2em] h-[2em] relative overflow-hidden">
            {instance.profilePicture && !imageError ? (
              <Image
                src={instance.profilePicture}
                alt={`${instance.handle}'s profile`}
                fill
                sizes="2em"
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <Image
                src="/images/default-pfp.svg"
                alt={`${instance.handle}'s avatar`}
                fill
                sizes="2em"
                className="object-cover"
              />
            )}
          </div>
          <div className="h-full w-full select-none cursor-pointer">
            <p className="text-white"> {instance.handle} </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserIcon;
