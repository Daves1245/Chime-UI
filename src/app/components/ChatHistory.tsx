"use client";

import React from 'react';
import Card from './Card';
import { v4 as uuidv4 } from 'uuid';

interface Message {
    text: string;
}

type MessageProps = {
    history?: Message[];
}

const ChatHistory: React.FC<MessageProps> = ({history = []}) => {
    return (
        <div>
            {history && (history.map((msg: Message) => (
                <Card key={uuidv4()} text={msg.text} />
            )))}
        </div>
    );
};

export default ChatHistory;
