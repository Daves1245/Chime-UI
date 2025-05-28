import React from 'react';
import User from '@/models/User';
import Image from 'next/image';

interface CardProps {
  user: User;
  text: string;
}

export default function Card({user, text}: CardProps) {
  const [imageError, setImageError] = React.useState(false);

  return (
    <div className="h-max-h w-auto p-4 flex hover:bg-box-highlight flex-row border-t bg-background border-border-highlight last:border-b">
      <div className="flex gap-4 self-stretch">
        <div className="w-[3em] h-[3em] rounded-full bg-red-500 relative overflow-hidden">
          {user.profilePicture && !imageError ? (
            <Image
              src={user.profilePicture}
              alt={`${user.handle[0]}`}
              fill
              sizes="3em"
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              {user.handle[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex flex-col grow">
          <div className="text-sm text-foreground font-bold text-gray-700">
            {user.handle}
          </div>
          <span className="font-normal text-[16px] leading-[1.5] text-foreground">
            {text}
          </span>
        </div>
      </div>
    </div>
  );
}
