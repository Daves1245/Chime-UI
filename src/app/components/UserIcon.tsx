import React, { useState } from 'react';
import User from '../../models/User';

interface UserIconProps {
    instance: User;
}

const DEFAULT = "#4A90E2";
const HOVER = "#2E609B";
const CLICKED = "#3A78C2";

const UserIcon: React.FC<UserIconProps> = ({instance}) => {
    const [color, setColor] = useState(DEFAULT);

    const onMouseDown = ()=> {
        setColor(CLICKED);
    };

    return (
        <div className="pb-0 w-full">
            {instance && (
                <div
                    onMouseOver={()=>{setColor(HOVER);}}
                    onMouseLeave={()=>{setColor(DEFAULT);}}
                    onMouseDown={onMouseDown}
                    onMouseUp={()=>{setColor(HOVER);}}
                    className={`h-full w-full select-none cursor-pointer transition-colors`}
                    style={{ backgroundColor: color }}
                >
                    <p> {instance.handle} </p>
                </div>
        )}
    </div>
    );
}

export default UserIcon;
