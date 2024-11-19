"use client";

import React, { useState } from 'react';
import ChatHistory from './ChatHistory';

interface Message {
    text: string;
}

const Chat = () => {
    const [history, setHistory] = useState<Message[]>([]);
    const [text, setText] = useState('');

    const addMessage = (text: string) => {
        setHistory([...history, { text }]);
    };

    const sendMessage = (text: string) => {
        // TODO interface with chime backend
        return;
    };

    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            console.log('pressed enter');
            sendMessage(text);
            e.preventDefault();
            addMessage(text);
            setText('');
        }
    };

    return (
        <div className="h-[100%] w-[100%] justify-end flex flex-grow flex-col items-center gap-2.5 bg-background p-2.5">
            <div className="p-2.5">
                <ChatHistory
                    history={history}
                />
            </div>
            <div className="w-[100%]">
                <div className="flex flex-col justify-end items-center gap-2 w-full">
                    <div className="flex self-stretch bg-white px-4 py-3 rounded-lg w-full">
                        <textarea
                            className="w-full h-20 resize-none bg-white border border-gray-300 rounded-lg p-2 text-[16px] text-[#1e1e1e] focus:outline-none focus:border-[#757575]"
                            value={text}
                            placeholder="Type your message here..."
                            onKeyDown={handleKeyPress}
                            onChange={onChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;

