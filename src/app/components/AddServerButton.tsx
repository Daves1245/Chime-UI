'use client';

import React, { useState } from 'react';

const DEFAULT = '#4A90E2';
const HOVER = '#2E609B';
const CLICKED = '#3A78C2';

interface AddServerButtonProps {
  onClick: () => void;
}

const AddServerButton: React.FC<AddServerButtonProps> = ({ onClick }) => {
  const [color, setColor] = useState(DEFAULT);

  return (
    <div className="p-2 w-[4em] h-[4em]">
      <div
        onClick={onClick}
        onMouseOver={() => setColor(HOVER)}
        onMouseLeave={() => setColor(DEFAULT)}
        onMouseDown={() => setColor(CLICKED)}
        onMouseUp={() => setColor(HOVER)}
        className="h-full w-full rounded-full grid place-items-center select-none cursor-pointer transition-colors"
        style={{ backgroundColor: color }}
      >
        <span className="text-white text-3xl font-light">+</span>
      </div>
    </div>
  );
};

export default AddServerButton;
