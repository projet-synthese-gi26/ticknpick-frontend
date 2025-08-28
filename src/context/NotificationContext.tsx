'use client';
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Définition du type de notification
interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Définition du contexte
interface NotificationContextType {
  addNotification: (message: string, type: Notification['type']) => void;
  notifications: Notification[];
  removeNotification: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider pour enrober votre application
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addNotification = useCallback((message: string, type: Notification['type']) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);

    // Disparition automatique après 6 secondes
    setTimeout(() => {
      removeNotification(id);
    }, 6000);
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification, notifications, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook personnalisé pour utiliser facilement le contexte
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification doit être utilisé au sein d un NotificationProvider');
  }
  return context;
};