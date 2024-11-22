"use client";

import React, { useState } from 'react';
import Server from '../../models/Server';

interface ServerIconProps {
    instance: Server;
    onServerSelect: (server: Server) => void;
}

const DEFAULT = "#4A90E2";
const HOVER = "#2E609B";
const CLICKED = "#3A78C2";

const ServerIcon: React.FC<ServerIconProps> = ({instance, onServerSelect}) => {
    const [color, setColor] = useState(DEFAULT);

    const onMouseDown = ()=> {
        setColor(CLICKED);
    };

    const onMouseUp = ()=> {
        setColor(HOVER);
        onServerSelect(instance);
    };

    return (
        <div className="pb-0 w-full">
            {instance && (
                <div 
                    onMouseOver={()=>{setColor(HOVER);}}
                    onMouseLeave={()=>{setColor(DEFAULT);}}
                    onMouseDown={onMouseDown}
                    onMouseUp={onMouseUp}
                    className={`h-full w-full select-none cursor-pointer transition-colors`}
                    style={{ backgroundColor: color }}
                >
                    <p> {instance.name} </p>
                </div>
        )}
    </div>
    );
};

export default ServerIcon;
