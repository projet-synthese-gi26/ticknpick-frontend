'use client';
import apiClient from './apiClient';

// Type enrichi avec les données nécessaires
export interface DelivererPackage {
    id: string;
    trackingNumber: string;
    pickupAddress: string;
    deliveryAddress: string;
    weight: number;
    deliveryFee: number;
    currentStatus: 'FOR_PICKUP' | 'ASSIGNED_TO_DELIVERER' | 'IN_TRANSIT' | 'AT_ARRIVAL_RELAY_POINT' | 'DELIVERED';
    
    // Champs étendus du backend
    currentRelayPointId?: string; // Crucial pour le MAP
    departureRelayPointId?: string;
    arrivalRelayPointId?: string;
    
    senderName?: string;
    senderPhone?: string;
    recipientName?: string;
    recipientPhone?: string;
    recipientAddress?: string;
    description?: string;
    createdAt?: string;
    dimensions?: string;
    packageType?: string;
    paymentStatus?: string;
    specialInstructions?: string;
    value?: number;
}

// Fonction utilitaire de log (Violet pour livreur)
const logViolet = (label: string, data: any) => {
    console.log(`%c🚚 [LIVREUR] ${label}`, 'color: #8b5cf6; font-weight: bold; background: #f3f0ff; padding: 2px 5px; border-radius: 4px;', data);
};

// Normalisation des données
const normalizePackage = (p: any): DelivererPackage => {
    return {
        id: p.id,
        trackingNumber: p.trackingNumber || 'N/A',
        pickupAddress: p.pickupAddress || 'Point Départ',
        deliveryAddress: p.deliveryAddress || p.recipientAddress || 'Destination',
        weight: p.weight || 0,
        deliveryFee: Number(p.deliveryFee || 0),
        currentStatus: p.currentStatus || p.status || 'FOR_PICKUP',
        
        currentRelayPointId: p.currentRelayPointId || p.departureRelayPointId,
        departureRelayPointId: p.departureRelayPointId,
        arrivalRelayPointId: p.arrivalRelayPointId,
        
        senderName: p.senderId ? "Client expéditeur" : "Inconnu", // ID masqué par défaut si pas de nom
        senderPhone: "Masqué avant acceptation",
        recipientName: p.recipientName,
        recipientPhone: p.recipientPhone,
        description: p.description,
        createdAt: p.createdAt,
        dimensions: p.dimensions,
        packageType: p.packageType,
        paymentStatus: p.paymentStatus,
        specialInstructions: p.specialInstructions,
        value: p.value
    };
};

const delivererService = {

    /**
     * Récupère tous les colis disponibles (Statut: FOR_PICKUP)
     * Utiliser pour peupler la carte
     */
    getAvailablePackages: async (): Promise<DelivererPackage[]> => {
        const url = '/api/deliverer/packages/available';
        logViolet('GET REQUEST', url);
        
        try {
            const response: any = await apiClient(url, 'GET');
            logViolet('GET RESPONSE', response);

            // Gestion structure : { packages: [...] }
            const rawList = Array.isArray(response) ? response : (response.packages || []);
            
            return rawList.map(normalizePackage);
        } catch (error) {
            console.error("❌ Deliverer Service Error:", error);
            throw error;
        }
    },

    /**
     * Mes Livraisons (ASSIGNED, IN_TRANSIT, etc.)
     */
    getMyDeliveries: async (): Promise<DelivererPackage[]> => {
        const url = '/api/deliverer/packages/my-deliveries';
        logViolet('GET REQUEST', url);
        
        try {
            const response: any = await apiClient(url, 'GET');
            logViolet('GET RESPONSE', response);
            
            const rawList = Array.isArray(response) ? response : (response.packages || []);
            return rawList.map(normalizePackage);
        } catch (error) {
            // Fallback vide si 404 (pas de courses)
            return [];
        }
    },

    /**
     * Accepter une course (S'assigner)
     */
    assignPackage: async (packageId: string): Promise<any> => {
        const url = `/api/deliverer/packages/${packageId}/assign`;
        logViolet('POST REQUEST (ASSIGN)', url);
        return apiClient(url, 'POST', {});
    },

    /**
     * Récupérer le colis (Débuter la course)
     * Passe de ASSIGNED -> IN_TRANSIT
     */
    pickupPackage: async (packageId: string): Promise<any> => {
        const url = `/api/deliverer/packages/${packageId}/pickup`;
        logViolet('POST REQUEST (PICKUP)', url);
        return apiClient(url, 'POST', {});
    },

    /**
     * Terminer la course (Livrer)
     * Passe de IN_TRANSIT -> DELIVERED
     */
    deliverPackage: async (packageId: string, confirmationCode?: string): Promise<any> => {
        // Selon l'API, parfois 'deliver-to-client'
        const url = `/api/deliverer/packages/${packageId}/deliver-to-client`;
        logViolet('POST REQUEST (DELIVER)', { url, code: confirmationCode });
        
        // Payload optionnel pour code
        const payload = confirmationCode ? { confirmationCode } : {};
        return apiClient(url, 'POST', payload);
    },

    /**
     * Récupérer TOUS les détails d'un colis spécifique
     * Appelé quand on clique sur la Sidebar Details
     */
    getPackageFullDetails: async (packageId: string): Promise<DelivererPackage> => {
        const url = `/api/packages/${packageId}`; // Route publique ou générique admin/user
        logViolet('GET DETAILS', url);
        const res: any = await apiClient(url, 'GET');
        logViolet('DETAILS RESPONSE', res);
        return normalizePackage(res);
    }
};

export { delivererService };