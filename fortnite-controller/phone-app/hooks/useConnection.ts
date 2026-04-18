// fortnite-controller/phone-app/hooks/useConnection.ts
import { useState, useEffect, useCallback } from 'react';
import { getConnectionService, StatusCallback } from '../services/ConnectionService';
import { ConnectionStatus, ControllerMessage } from '@fortnite-controller/shared';

export function useConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const connection = getConnectionService();

  useEffect(() => {
    connection.onStatusChange(setStatus);
    return () => connection.disconnect();
  }, [connection]);

  const connect = useCallback((ip: string) => {
    connection.connect(ip);
  }, [connection]);

  const send = useCallback((message: ControllerMessage) => {
    connection.send(message);
  }, [connection]);

  const disconnect = useCallback(() => {
    connection.disconnect();
  }, [connection]);

  return {
    status,
    connect,
    send,
    disconnect,
  };
}