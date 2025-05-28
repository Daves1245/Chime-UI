"use client";

import React, { useState, useRef, useEffect } from 'react';
import ChatHistory from './ChatHistory';
import Server from '../../models/Server';
import User from '../../models/User';
import UserList from './UserList';

interface Message {
    text: string;
    user?: User;
    channel: string;
}

interface ChatServerProps {
    server: Server;
    channel: string;
}

const Chat: React.FC<ChatServerProps> = ({ server, channel }) => {
    const [history, setHistory] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        });
    };

    // Scroll to bottom when component mounts
    useEffect(() => {
        scrollToBottom();
    }, []);

    // Scroll to bottom when history changes
    useEffect(() => {
        scrollToBottom();
    }, [history]);

    const addMessage = (text: string) => {
        if (!text.trim()) return;
        // Create a temporary user for now
        const tempUser = new User('You', 'temp-id', '/pfp.png');
        const newMessage = { text, user: tempUser, channel };
        setHistory(prev => [...prev, newMessage]);
    };

    const sendMessage = async (messageText: string) => {
        // TODO interface with chime backend
        try {
            // Placeholder for future backend integration
            console.log('Sending message:', messageText, 'to channel:', channel);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(text);
            addMessage(text);
            setText('');
        }
    };

    // Filter messages for current channel
    const channelHistory = history.filter(msg => msg.channel === channel);

    return (
        <div className="flex flex-col h-full w-full border-l border-border-highlight">
            <div className="h-[3em] flex-shrink-0 bg-box-background border-b border-border-highlight flex justify-between items-center px-4">
                <div className="select-none font-semibold">
                    # {channel}
                </div>
            </div>
            <div className="flex flex-row flex-grow">
                <div className="flex-grow h-full flex flex-col bg-background">
                    {/* Chat History and Input box */}
                    <div className="flex-grow flex flex-col overflow-hidden">
                        {/* Chat History */}
                        <div
                            ref={chatContainerRef}
                            className="flex-grow overflow-y-auto bg-background"
                        >
                            <div className="h-full flex flex-col">
                                <div className="flex-grow" />
                                <ChatHistory history={channelHistory} />
                            </div>
                        </div>

                        {/* Message input */}
                        <div className="w-full p-2 flex-shrink-0 bg-background">
                            <textarea
                                className="w-full h-20 resize-none bg-box-background border border-box-highlight rounded-lg p-2 text-[16px] text-[#ffffff] focus:outline-none focus:border-[#757575]"
                                value={text}
                                placeholder={`Message #${channel}...`}
                                onKeyDown={handleKeyPress}
                                onChange={onChange}
                            />
                        </div>
                    </div>
                </div>
                <div className="w-[15%] flex-shrink-0 bg-background border-l border-border-highlight">
                    <UserList server={server} showHeader={false} />
                </div>
            </div>
        </div>
    );
};

export default Chat;
