"use client";

import React from 'react';
import Card from './Card';
import MessageBox from './MessageBox';
import ReplyButton from './ReplyButton';

const Chat = () => {
    return (
        <div className="h-[100%] w-[100%] justify-end flex flex-grow flex-col items-center gap-2.5 bg-background p-2.5">
            <div className="p-2.5">
                <Card />
                <Card />
            </div>
            <div className="w-[100%]">
                <MessageBox />
            </div>
        </div>
    );
}

export default Chat;
