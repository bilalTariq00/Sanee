// src/components/NotificationBell.jsx
import React, { useState } from 'react';
import  useNotification

const NotificationBell = () => {
  const { unreadCount, isConnected } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="notification-bell">
      <button onClick={() => setIsOpen(!isOpen)}>
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        {!isConnected && <span className="connection-indicator offline"></span>}
      </button>
      {isOpen && <NotificationDropdown />}
    </div>
  );
};

export default NotificationBell;
