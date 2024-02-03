import React, { createContext, useContext, useState } from 'react';
import Notification from './Components/Notification/Notification';

interface NotificationContextProps {
  showNotification: (id: string, content: string) => void;
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<{id: string, content: string}[]>([]);

  const handleClose = (index: number) => {
    setNotifications((prevNotifications) => prevNotifications.filter((_, i) => i !== index));
  };

  const showNotification = (id: string, content: string) => {
    setNotifications((prevNotifications) => {
      let already = prevNotifications.find(notif => notif.id === id)
      if (already)
        return [...prevNotifications]
      else
        return [...prevNotifications, {id, content}]
    });
    console.log(notifications)

    setTimeout(() => {
      setNotifications((prevNotifications) => prevNotifications.slice(1));
    }, 5000);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map((data, index) => (
          <Notification key={index} closeFunction={()=>handleClose(index)} id={data.id} content={data.content} index={index}/>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context.showNotification;
};
