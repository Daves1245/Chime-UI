"use client";

import React, { useState } from 'react';
import Card from './Card';
import MessageBox from './MessageBox';
import ReplyButton from './ReplyButton';
import ChatHistory from './ChatHistory';

const Chat = ()=> {

    const [history, setHistory] = useState([]);
    const [text, setText] = useState('');
    const [id, setId] = useState(0);

    const addMessage = (text) => {
        setHistory([...history, new Card(id, text)])
        setId(id + 1);
    }

    const sendMessage = (text) => {

    }

    const onChange = (e) => {
        setText(e.target.value);
    }

    const handleKeyPress = (e) => {
        setText(e.target.value);
        if (e.key == "Enter") {
            console.log("pressed enter");
            sendMessage();
            e.preventDefault();
            addMessage(text)
            setText('');
        }
    }

    return (
        <div className="h-[100%] w-[100%] justify-end flex flex-grow flex-col items-center gap-2.5 bg-background p-2.5">
            <div className="p-2.5">
                <ChatHistory history={history}/>
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
}

export default Chat;
