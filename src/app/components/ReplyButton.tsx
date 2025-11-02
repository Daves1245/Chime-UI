'use client';

import React from 'react';

const ReplyButton = () => {
  const handleOnClick = () => {
    alert('clicked');
  };

  return (
    <div className="w-[95px] flex justify-end items-center gap-4">
      <button
        className="flex justify-center items-center gap-2 grow bg-[#e3e3e3] p-3 rounded-lg border border-solid border-[#767676] text-[#333333]"
        onClick={handleOnClick}
      >
        Reply
      </button>
    </div>
  );
};

export default ReplyButton;
