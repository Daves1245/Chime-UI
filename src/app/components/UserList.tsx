"use client";

import React, { useState } from 'react';
import User from '../../models/User';
import UserIcon from './UserIcon';

const UserList = () => {
    const [users, setUsers] = useState([
        new User("billybob", "123"),
        new User("johndoe", "123"),
        new User("alex", "123"),
        new User("bob", "123"),
    ])

    return (
        <div className="w-[20%] bg-red">
            {users.map((user, index) => (
                <UserIcon key={index} instance={user} />
            ))}
        </div>
    );
}

export default UserList;
