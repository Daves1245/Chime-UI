'use client';

import React, { useState, useEffect } from 'react';
import {
  ServerInfo,
  defaultServerInfo,
  validateServerField,
} from '@/models/ServerInfo';

interface AddServerFormProps {
  onSubmit: (serverInfo: ServerInfo) => void;
  onCancel: () => void;
}

interface ValidationErrors {
  name?: string;
  ip?: string;
  port?: string;
}

const AddServerForm: React.FC<AddServerFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [serverInfo, setServerInfo] = useState<ServerInfo>(defaultServerInfo);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isValid, setIsValid] = useState(false);

  // Update validity whenever serverInfo changes
  useEffect(() => {
    const validateForm = () => {
      const newErrors: ValidationErrors = {};

      if (!validateServerField.name(serverInfo.name)) {
        newErrors.name = 'Server name is required';
      }

      if (!validateServerField.ip(serverInfo.ip)) {
        newErrors.ip = 'Invalid IP address';
      }

      if (!validateServerField.port(serverInfo.port)) {
        newErrors.port = 'Port must be between 1 and 65535';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    setIsValid(validateForm());
  }, [serverInfo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validateForm = () => {
      const newErrors: ValidationErrors = {};

      if (!validateServerField.name(serverInfo.name)) {
        newErrors.name = 'Server name is required';
      }

      if (!validateServerField.ip(serverInfo.ip)) {
        newErrors.ip = 'Invalid IP address';
      }

      if (!validateServerField.port(serverInfo.port)) {
        newErrors.port = 'Port must be between 1 and 65535';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    if (validateForm()) {
      onSubmit(serverInfo);
    }
  };

  const handleChange =
    (field: keyof ServerInfo) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === 'port' ? parseInt(e.target.value) || 0 : e.target.value;
      setServerInfo(prev => ({ ...prev, [field]: value }));
    };

  return (
    <form onSubmit={handleSubmit} className="bg-box-background p-6 rounded-lg">
      <h2 className="text-xl font-semibold text-white mb-4">Add New Server</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Server Name
          </label>
          <input
            type="text"
            value={serverInfo.name}
            onChange={handleChange('name')}
            className="w-full px-3 py-2 bg-background border border-border-highlight rounded-md text-white focus:outline-none focus:border-[#757575]"
            placeholder="My Server"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-1">
            IP Address
          </label>
          <input
            type="text"
            value={serverInfo.ip}
            onChange={handleChange('ip')}
            className="w-full px-3 py-2 bg-background border border-border-highlight rounded-md text-white focus:outline-none focus:border-[#757575]"
            placeholder="127.0.0.1"
          />
          {errors.ip && (
            <p className="mt-1 text-sm text-red-500">{errors.ip}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Port
          </label>
          <input
            type="number"
            value={serverInfo.port}
            onChange={handleChange('port')}
            className="w-full px-3 py-2 bg-background border border-border-highlight rounded-md text-white focus:outline-none focus:border-[#757575]"
            placeholder="8080"
            min="1"
            max="65535"
          />
          {errors.port && (
            <p className="mt-1 text-sm text-red-500">{errors.port}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-white hover:bg-box-highlight rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid}
          className={`px-4 py-2 rounded-md transition-colors ${
            isValid
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-500 cursor-not-allowed text-gray-300'
          }`}
        >
          Add Server
        </button>
      </div>
    </form>
  );
};

export default AddServerForm;
