import React from 'react';
import ReplyButton from './ReplyButton';

interface CardProps {
  text: string;
}

export default function Card({ text }: CardProps) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col justify-between bg-[#e2f1e7] p-6 rounded-lg border border-solid border-[#d9d9d9]">
        <div className="flex gap-4 self-stretch">
          <div className="w-12 h-12 flex items-center justify-center">
            <svg className="w-9 h-9" />
          </div>
          <div className="flex flex-col grow">
            {/* Updated text style for better visibility */}
            <span className="font-normal text-[16px] leading-[1.5] text-[#333333]">
              {text}
            </span>
          </div>
          <div>
            <ReplyButton />
          </div>
        </div>
      </div>
    </div>
  );
}

