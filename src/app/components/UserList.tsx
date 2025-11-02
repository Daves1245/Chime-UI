'use client';

import React from 'react';
import UserIcon from './UserIcon';
import Server from '@/models/Server';

interface UserListProps {
  server: Server;
  showHeader?: boolean;
}

const UserList: React.FC<UserListProps> = ({ server, showHeader = true }) => {
  return (
    <div className="w-full h-auto bg-background overflow-y-auto">
      {showHeader && (
        <div className="h-[3em] flex-shrink-0 bg-box-background border-b border-border-highlight"></div>
      )}
      <div className="flex flex-col h-full gap-1 p-2">
        {server.users.map((user, index) => (
          <UserIcon key={index} instance={user} />
        ))}
      </div>
    </div>
  );
};

export default UserList;
