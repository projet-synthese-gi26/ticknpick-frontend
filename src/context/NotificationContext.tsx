// FICHIER : src/context/NotificationContext.tsx
'use client';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { notificationService, NotificationDTO } from '@/services/NotificationService';
import { useAuth } from './AuthContext';

// Notification temporaire (Toast UI)
export interface ToastNotification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string; // Ajout optionnel
}

interface NotificationContextType {
  // Gestion des Toasts (Flash messages)
  addNotification: (message: string, type: ToastNotification['type'], title?: string) => void;
  notifications: ToastNotification[]; // Pour le banner
  removeNotification: (id: number) => void;

  // Gestion des Notifications Persistantes (Backend)
  inbox: NotificationDTO[];
  unreadCount: number;
  refreshInbox: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isLoadingInbox: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth(); // Pour ne charger que si connecté
  
  // --- ÉTAT 1 : TOASTS ---
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const removeNotification = (id: number) => {
    setToasts((prev) => prev.filter((n) => n.id !== id));
  };

  const addNotification = useCallback((message: string, type: ToastNotification['type'], title?: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => removeNotification(id), 6000);
  }, []);

  // --- ÉTAT 2 : INBOX BACKEND ---
  const [inbox, setInbox] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);

  // Fonction pour charger les données backend
  const refreshInbox = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingInbox(true);
    try {
        // Appels parallèles
        const [count, recentList] = await Promise.all([
            notificationService.getUnreadCount(),
            notificationService.getRecentNotifications()
        ]);
        setUnreadCount(count);
        setInbox(recentList);
    } catch (e) {
        console.error("Sync notifs failed", e);
    } finally {
        setIsLoadingInbox(false);
    }
  }, [isAuthenticated]);

  // Chargement initial + Polling léger (ex: toutes les 60s)
  useEffect(() => {
    if (isAuthenticated) {
        refreshInbox();
        const interval = setInterval(refreshInbox, 60000);
        return () => clearInterval(interval);
    } else {
        setInbox([]);
        setUnreadCount(0);
    }
  }, [isAuthenticated, refreshInbox]);

  // Actions métier
  const handleMarkAsRead = async (id: string) => {
      // Optimistic update UI
      setInbox(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Appel API
      await notificationService.markAsRead(id);
      // Pas besoin de refresh complet ici pour garder la fluidité
  };

  const handleMarkAllRead = async () => {
      setInbox(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await notificationService.markAllAsRead();
  };

  return (
    <NotificationContext.Provider value={{ 
        // Partie Toast
        addNotification, 
        notifications: toasts, 
        removeNotification,
        // Partie Inbox
        inbox,
        unreadCount,
        refreshInbox,
        markAsRead: handleMarkAsRead,
        markAllAsRead: handleMarkAllRead,
        isLoadingInbox
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};