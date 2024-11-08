"use client";

import React, { useState } from 'react';
import { useEffect } from 'react';
import Server from '../../models/Server';

interface ServerIconProps {
    instance: Server;
}

const ServerIcon: React.FC<ServerIconProps> = ({instance}) => {
    return (
        <div className="bg-[#4A90E2] pb-2 w-[100%]">
            {instance && (
                <div>
                    <p> {instance.name} </p>
                </div>
            )}
        </div>
    );
};

export default ServerIcon;
