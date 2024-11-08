"use client";

import React, { useState } from 'react';
import { useEffect } from 'react';
import Server from 'app/models/Server';

// server = [...server]

const ServerIcon = () => {
    const [instance, setInstance] = useState(null);

    useEffect(() => {
        const test = new Server('Server', )
    }, []);

    return (
        <div>
            {instance && (
                <div>
                </div>
            )}
        </div>
    );
};

export default ServerIcon;
