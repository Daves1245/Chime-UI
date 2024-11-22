"use client";

import React, { useState } from 'react';
import User from '../../models/User';
import UserIcon from './UserIcon';
import Server from '../../models/Server';

interface UserListProps {
    server: Server
}

const UserList: React.FC<UserListProps> = ({server}) => {
    return (
        <div className="w-[20%] bg-red">
            {server.users.map((user, index) => (
                <UserIcon key={index} instance={user} />
            ))}
        </div>
    );
}

export default UserList;
