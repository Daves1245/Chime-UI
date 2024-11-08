"use client";

import React, { useState } from 'react';

const ServerList = (serverList) => {
    const [items, setItems] = useState([])

    return (
        <div className="w-[20%]">
            {items.map((server, index) => {
                <Server key={index} data={server.data} />
            })}
        </div>
    );
}

export default ServerList;
