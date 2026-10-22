import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
    });
  }
  return socketInstance;
}

export function useSocketConnection() {
  const [connected, setConnected] = useState(() => {
    const s = getSocket();
    return s.connected;
  });

  useEffect(() => {
    const socket = getSocket();
    setConnected(socket.connected);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return connected;
}

export function useSocket(handlers = {}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const socket = getSocket();
    const eventNames = Object.keys(handlersRef.current);

    const listeners = {};
    eventNames.forEach((event) => {
      listeners[event] = (...args) => {
        handlersRef.current[event]?.(...args);
      };
      socket.on(event, listeners[event]);
    });

    return () => {
      eventNames.forEach((event) => {
        socket.off(event, listeners[event]);
      });
    };
  }, []);
}
