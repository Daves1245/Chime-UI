import React from 'react';
import ReplyButton from './ReplyButton';

const MessageBox = () => {
    return (
        <div className="flex flex-col justify-end items-center gap-2 w-full">
            <div className="flex self-stretch bg-white px-4 py-3 rounded-lg w-full">
                <textarea
                    className="w-full h-20 resize-none bg-white border border-gray-300 rounded-lg p-2 text-[16px] text-[#1e1e1e] focus:outline-none focus:border-[#757575]"
                    placeholder="Type your message here..."
                />
            </div>
        </div>
    );
};

export default MessageBox;

