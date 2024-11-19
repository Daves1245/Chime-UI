"use client";

import React, { useState } from 'react';
import Card from './Card';
import { v4 as uuidv4 } from 'uuid';

type MessageProps = {
    history?: { id: number, message: string }[];
}

const ChatHistory: React.FC<MessageProps> = ({history = []}) => {
    return (
        <div>
            {history && (history.map((msg) => (
                <Card key={uuidv4()} text={msg.text} />
            )))}
        </div>
    );
};

export default ChatHistory;
