import React from 'react';
import User from '../../models/User';

interface UserIconProps {
    instance: User;
}

const UserIcon: React.FC<ServerIconProps> = ({instance}) => {
    return (
        <div className="bg-[#4A90E2] pb-2 w-[100%]">
            {instance && (
                <div>
                    <p> {instance.handle} </p>
                </div>
            )}
        </div>
    );
}

export default UserIcon;
