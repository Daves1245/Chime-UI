import React from 'react';
import User from '@/models/User';
import Image from 'next/image';

interface CardProps {
  user: User;
  text: string;
}

export default function Card({ user, text }: CardProps) {
  const [imageError, setImageError] = React.useState(false);

  const profilePictureSrc =
    user.profilePicture && !imageError
      ? user.profilePicture
      : '/images/default-pfp.svg';

  return (
    <div
      className="h-max-h w-auto p-4 flex hover:bg-box-highlight flex-row border-t bg-background border-border-highlight last:border-b"
      role="message-container"
    >
      <div className="flex gap-4 self-stretch">
        <div className="w-[3em] h-[3em] rounded-full bg-red-500 relative overflow-hidden">
          <Image
            src={profilePictureSrc}
            alt={`${user.handle}'s avatar`}
            fill
            sizes="3em"
            className="object-cover"
            onError={() => setImageError(true)}
          />
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
