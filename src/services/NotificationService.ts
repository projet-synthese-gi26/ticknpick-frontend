// FICHIER : src/services/notificationService.ts
import apiClient from './apiClient';

// Basé sur le schéma "NotificationDTO" du Swagger
export interface NotificationDTO {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ALERT' | 'SYSTEM' | 'PACKAGE_STATUS_UPDATE' | 'DELIVERY_ASSIGNED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    isRead: boolean;
    createdAt: string;
    readAt?: string;
    relatedEntityId?: string;
    relatedEntityType?: string;
}

export interface NotificationStats {
    total: number;
    read: number;
    unread: number;
}

// 1. Récupérer le compteur de non-lus
const getUnreadCount = async (): Promise<number> => {
    try {
        const res: any = await apiClient('/api/notifications/unread/count', 'GET');
        // Gérer si le retour est un objet { unread: 5 } ou juste un nombre 5
        return typeof res === 'number' ? res : (res?.unread || 0);
    } catch (e) {
        console.error("Erreur compteur notifs", e);
        return 0;
    }
};

// 2. Récupérer les notifications récentes (Liste)
const getRecentNotifications = async (): Promise<NotificationDTO[]> => {
    try {
        const res = await apiClient<NotificationDTO[]>('/api/notifications/recent', 'GET');
        return Array.isArray(res) ? res : [];
    } catch (e) {
        console.error("Erreur chargement notifs", e);
        return [];
    }
};

// 3. Marquer une notification spécifique comme lue (Route spécifiquement demandée)
// POST /api/notification-statuses/{notificationId}/read
const markAsRead = async (notificationId: string): Promise<any> => {
    return apiClient(`/api/notification-statuses/${notificationId}/read`, 'POST');
};

// 4. Marquer tout comme lu
const markAllAsRead = async (): Promise<any> => {
    return apiClient('/api/notifications/read-all', 'PUT');
};

export const notificationService = {
    getUnreadCount,
    getRecentNotifications,
    markAsRead,
    markAllAsRead
};