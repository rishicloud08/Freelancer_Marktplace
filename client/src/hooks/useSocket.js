import { useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';

const useSocket = () => {
  const { token, user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token || !user) return;

    const newSocket = io(window.location.origin, {
      auth: { token },
      path: '/socket.io'
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  return socket;
};

export default useSocket;