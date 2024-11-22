"use client";

import React, { useState } from 'react';
import ChatHistory from './ChatHistory';
import Server from '../../models/Server';

interface Message {
    text: string;
}

interface ChatServerProps {
    server: Server;
}

const Chat: React.FC<ChatServerProps> = ({ server }) => {
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
            sendMessage(text);
            e.preventDefault();
            addMessage(text);
            setText('');
        }
    };

    return (
        <div className="h-[100%] w-[100%] flex flex-col bg-background p-2.5">
            {/* Server title*/}
            <div className="w-full bg-gray-800 text-white p-2 text-center font-semibold">
                {server.name}
            </div>

            {/* Chat History and Input box */}
            <div className="flex-grow flex flex-col justify-end w-full">
                {/* Chat History */}
                <div className="max-h-[400px] overflow-y-auto p-2.5 bg-white border border-gray-300 rounded-lg">
                    <ChatHistory history={history} />
                </div>

                {/* Message input */}
                <div className="w-full p-2">
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

