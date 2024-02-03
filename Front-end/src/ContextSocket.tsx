import React, { createContext, useContext } from 'react';

interface SocketContextProps {
  socket: any; 
}

const SocketContext = createContext<SocketContextProps | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('error Socket provider mes couilles');
  }
  return context.socket;
};

interface SocketProviderProps {
  socket: any; 
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ socket, children }) => {
  return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>;
};
