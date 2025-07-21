// src/contexts/UnreadContext.tsx
import React, { createContext, useContext } from 'react';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

const UnreadContext = createContext<ReturnType<typeof useUnreadMessages> | null>(null);

export const UnreadProvider: React.FC = ({ children }) => {
  // You can even shorten the poll to 3 s if you like.
  const unread = useUnreadMessages(30000);
  return (
    <UnreadContext.Provider value={unread}>
      {children}
    </UnreadContext.Provider>
  );
};

export const useUnread = () => {
  const ctx = useContext(UnreadContext);
  if (!ctx) throw new Error('useUnread must be inside UnreadProvider');
  return ctx;
};
