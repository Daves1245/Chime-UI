'use client';

import React from 'react';
import Card from './Card';
import { v4 as uuidv4 } from 'uuid';
import User from '@/models/User';
import { ChimeMessage } from '@/types/Message';

type MessageProps = {
  history?: ChimeMessage[];
  loading?: boolean;
};

const ChatHistory: React.FC<MessageProps> = ({ history = [], loading = false }) => {
  if (loading) {
    return (
      <div className="flex flex-col overflow-y-auto justify-end">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse mb-4 p-3 bg-box-background rounded-lg">
            <div className="flex items-center mb-2">
              <div className="h-8 w-8 bg-gray-600 rounded-full mr-3"></div>
              <div className="h-4 bg-gray-600 rounded w-20"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-600 rounded w-full"></div>
              <div className="h-3 bg-gray-600 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto justify-end">
      {history.map((msg: ChimeMessage) => (
        <Card
          key={uuidv4()}
          text={msg.content}
          user={new User(msg.userId, msg.userId)}
        />
      ))}
    </div>
  );
};

export default ChatHistory;
