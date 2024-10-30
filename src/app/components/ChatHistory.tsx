"use client";

import React, { useState } from 'react';
import Card from './Card';

type MessageProps = {
    history?: { id: number, message: string }[];
}

const ChatHistory: React.FC<MessageProps> = ({history = []}) => {
    return (
        <div>
            {history.map((msg) => (
                <Card key={msg.id} text={msg.text} />
            ))}
        </div>
    );
};

export default ChatHistory;
