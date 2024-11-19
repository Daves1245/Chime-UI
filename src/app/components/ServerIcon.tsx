"use client";

import React, { useState } from 'react';
import { useEffect } from 'react';
import Server from '../../models/Server';

interface ServerIconProps {
    instance: Server;
}

const ServerIcon: React.FC<ServerIconProps> = ({instance}) => {

    const [hover, setHover] = useState(false);

    const onClick = ()=> {

    };

    return (
        <div className="pb-0 w-full">
            {instance && (
                <div 
                    onClick={onClick}
                    onMouseOver={()=>{setHover(true);}}
                    onMouseLeave={()=>{setHover(false);}}
                    className={`h-full w-full ${hover ? 'bg-[#3A78C2]' : 'bg-[#4A90E2]'}`}
                >
                    <p> {instance.name} </p>
                </div>
        )}
    </div>
    );
};

export default ServerIcon;
