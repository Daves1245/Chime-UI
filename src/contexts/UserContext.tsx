'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import User from '../models/User';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // For now, create a default user
  const [currentUser, setCurrentUser] = useState<User | null>(
    new User('You', 'temp-user-id', '/pfp.png')
  );

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
