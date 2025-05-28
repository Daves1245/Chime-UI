"use client";

import React, { useState, FC } from 'react';
import { X } from 'lucide-react';
import Server from '@/models/Server';

interface NewServerOverlayProps {
    onClose: () => void;
    onAddServer: () => void;
}

interface ServerFormData {
    name: string;
    ip: string;
    port: number;
}

const NewServerOverlay: FC<NewServerOverlayProps> = ({onClose, onAddServer}) => {
    const [serverData, setServerData] = useState<ServerFormData>({
        name: '',
        ip: '',
        port: -1,
    });

    const handleChange = (field: string, value: string | number) => {
        setServerData({
            ...serverData,
            [field]: value,
        });
    };

    return (
        <>

        </>
    );
};

export default NewServerOverlay;
