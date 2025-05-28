"use client";

import React from 'react';
import Card from './Card';
import { v4 as uuidv4 } from 'uuid';
import User from '@/models/User';

interface Message {
    text: string;
    user?: User;
    channel: string;
}

type MessageProps = {
    history?: Message[];
}

const ChatHistory: React.FC<MessageProps> = ({history = []}) => {
    return (
        <div className="flex flex-col justify-end h-full">
            {history.map((msg: Message) => (
                <Card
                    key={uuidv4()}
                    text={msg.text}
                    user={msg.user || new User('You', uuidv4())}
                />
            ))}
        </div>
    );
};

export default ChatHistory;
