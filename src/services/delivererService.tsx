// FICHIER: src/services/delivererService.ts
'use client';
import apiClient from './apiClient';

// --- TYPES & INTERFACES ---

export interface DelivererPackage {
    id: string;
    trackingNumber: string;
    pickupAddress: string;
    deliveryAddress: string;
    weight: number;
    deliveryFee: number;
    // Ajout des nouveaux status
    currentStatus: 'FOR_PICKUP' | 'ASSIGNED_TO_DELIVERER' | 'IN_TRANSIT' | 'AT_ARRIVAL_RELAY_POINT' | 'DELIVERED' | 'DELIVERED_TO_CLIENT' | 'DAMAGED' | 'DELIVERY_FAILED';
    
    senderName?: string;
    senderPhone?: string;
    recipientName?: string;
    recipientPhone?: string;
    description?: string;
    packageType?: string; // Standard, Fragile, etc.
    designation?: string; // Titre court
    
    // Champs spécifiques
    currentRelayPointId?: string;
    departureRelayPointId?: string;
    arrivalRelayPointId?: string;
    createdAt?: string;
    dimensions?: string;
    paymentStatus?: string;
    specialInstructions?: string;
}

// Stats DTO
export interface DelivererStats {
    totalDeliveries: number;
    successRate: number;
    totalEarnings: number;
    currentRating: number;
}

// Utilitaire de log pour console
const logViolet = (label: string, data: any, type: 'REQ' | 'RES' = 'REQ') => {
    const styles = type === 'REQ' 
        ? 'color: #7c3aed; font-weight: bold; background: #ede9fe; padding: 2px 6px; border-radius: 4px; border-left: 3px solid #7c3aed;'
        : 'color: #10b981; font-weight: bold; background: #ecfdf5; padding: 2px 6px; border-radius: 4px; border-left: 3px solid #10b981;';
    
    console.groupCollapsed(`%c🚚 [LIVREUR API] ${label}`, styles);
    console.log(data);
    console.groupEnd();
};

const normalizePackage = (p: any): DelivererPackage => {
    return {
        id: p.id,
        trackingNumber: p.trackingNumber || p.tracking_number || 'N/A',
        pickupAddress: p.pickupAddress || p.departurePointName || 'Point Départ',
        deliveryAddress: p.deliveryAddress || p.recipientAddress || p.arrivalPointName || 'Destination',
        weight: Number(p.weight || 0),
        deliveryFee: Number(p.deliveryFee || p.shippingCost || 0),
        currentStatus: (p.currentStatus || p.status || 'FOR_PICKUP').toUpperCase(),
        
        currentRelayPointId: p.currentRelayPointId,
        departureRelayPointId: p.departureRelayPointId,
        arrivalRelayPointId: p.arrivalRelayPointId,
        
        senderName: p.senderName || "Client expéditeur",
        senderPhone: p.senderPhone,
        recipientName: p.recipientName,
        recipientPhone: p.recipientPhone,
        description: p.description,
        designation: p.designation || p.packageType || "Colis", // Fallback designation
        createdAt: p.createdAt,
        packageType: p.packageType,
        paymentStatus: p.paymentStatus,
        specialInstructions: p.specialInstructions,
    };
};

const delivererService = {

    // --- GET METHODS ---

    /** GET /api/deliverer/stats */
    getStats: async (): Promise<DelivererStats> => {
        const url = '/api/deliverer/stats';
        logViolet('GET REQUEST Stats', url);
        try {
            const res = await apiClient<DelivererStats>(url, 'GET');
            logViolet('GET RESPONSE Stats', res, 'RES');
            return res;
        } catch (e) {
            console.error(e);
            // Fallback pour dev si l'API n'est pas prête
            return { totalDeliveries: 0, successRate: 100, totalEarnings: 0, currentRating: 5.0 };
        }
    },

    /** GET /api/deliverer/packages/available */
    getAvailablePackages: async (): Promise<DelivererPackage[]> => {
        const url = '/api/deliverer/packages/available';
        logViolet('GET REQUEST Available', url);
        const res: any = await apiClient(url, 'GET');
        logViolet('GET RESPONSE Available', res, 'RES');
        const list = Array.isArray(res) ? res : (res.packages || []);
        return list.map(normalizePackage);
    },

    /** GET /api/deliverer/packages/nearby */
    getNearbyPackages: async (lat: number, lng: number, radiusKm: number = 5): Promise<DelivererPackage[]> => {
        const url = `/api/deliverer/packages/nearby?latitude=${lat}&longitude=${lng}&radiusKm=${radiusKm}`;
        logViolet('GET REQUEST Nearby', { url, params: { lat, lng, radiusKm } });
        const res: any = await apiClient(url, 'GET');
        logViolet('GET RESPONSE Nearby', res, 'RES');
        const list = Array.isArray(res) ? res : (res.packages || []);
        return list.map(normalizePackage);
    },

    /** GET /api/deliverer/packages/my-deliveries */
    getMyDeliveries: async (): Promise<DelivererPackage[]> => {
        const url = '/api/deliverer/packages/my-deliveries';
        logViolet('GET REQUEST MyDeliveries', url);
        try {
            const res: any = await apiClient(url, 'GET');
            logViolet('GET RESPONSE MyDeliveries', res, 'RES');
            const list = Array.isArray(res) ? res : (res.packages || []);
            return list.map(normalizePackage);
        } catch (e) { return []; }
    },

    /** GET /api/deliverer/packages/{packageId}/details */
    getPackageDetails: async (packageId: string): Promise<DelivererPackage> => {
        const url = `/api/deliverer/packages/${packageId}/details`;
        logViolet('GET REQUEST Details', url);
        const res = await apiClient<any>(url, 'GET');
        logViolet('GET RESPONSE Details', res, 'RES');
        return normalizePackage(res);
    },


    // --- ACTION POST/PUT METHODS ---

    /** POST /api/deliverer/packages/{packageId}/assign */
    assignPackage: async (packageId: string): Promise<any> => {
        const url = `/api/deliverer/packages/${packageId}/assign`;
        logViolet('POST REQUEST Assign', { url, packageId });
        const res = await apiClient(url, 'POST', {});
        logViolet('POST RESPONSE Assign', res, 'RES');
        return res;
    },

    /** POST /api/deliverer/packages/{packageId}/cancel-assignment */
    cancelAssignment: async (packageId: string, reason: string): Promise<any> => {
        const url = `/api/deliverer/packages/${packageId}/cancel-assignment`;
        const body = { cancellationReason: reason };
        logViolet('POST REQUEST Cancel', { url, body });
        const res = await apiClient(url, 'POST', body);
        logViolet('POST RESPONSE Cancel', res, 'RES');
        return res;
    },

    /** POST /api/deliverer/packages/{packageId}/pickup */
    pickupPackage: async (packageId: string): Promise<any> => {
        const url = `/api/deliverer/packages/${packageId}/pickup`;
        logViolet('POST REQUEST Pickup', url);
        // Note: Ajouter geolocation ou photo ici si requis par votre API plus tard
        const res = await apiClient(url, 'POST', {}); 
        logViolet('POST RESPONSE Pickup', res, 'RES');
        return res;
    },

    /** POST /api/deliverer/packages/{packageId}/deliver-to-relay */
    deliverToRelay: async (packageId: string, relayId: string): Promise<any> => {
        const url = `/api/deliverer/packages/${packageId}/deliver-to-relay`;
        const body = { relayPointId: relayId };
        logViolet('POST REQUEST DeliverToRelay', { url, body });
        const res = await apiClient(url, 'POST', body);
        logViolet('POST RESPONSE DeliverToRelay', res, 'RES');
        return res;
    },

    /** POST /api/deliverer/packages/{packageId}/deliver-to-client */
    deliverToClient: async (packageId: string, confirmationCode?: string): Promise<any> => {
        const url = `/api/deliverer/packages/${packageId}/deliver-to-client`;
        const body = { confirmationCode };
        logViolet('POST REQUEST DeliverToClient', { url, body });
        const res = await apiClient(url, 'POST', body);
        logViolet('POST RESPONSE DeliverToClient', res, 'RES');
        return res;
    },

    /** POST /api/deliverer/packages/{packageId}/delivery-failed */
    reportDeliveryFailed: async (packageId: string, reason: string): Promise<any> => {
        const url = `/api/deliverer/packages/${packageId}/delivery-failed`;
        const body = { failureReason: reason };
        logViolet('POST REQUEST Fail', { url, body });
        const res = await apiClient(url, 'POST', body);
        logViolet('POST RESPONSE Fail', res, 'RES');
        return res;
    },

    /** POST /api/deliverer/packages/{packageId}/report-damage */
    reportDamage: async (packageId: string, description: string, photos: File[] = []): Promise<any> => {
        const url = `/api/deliverer/packages/${packageId}/report-damage`;
        
        // Gestion Multipart pour les photos
        const formData = new FormData();
        formData.append('description', description);
        photos.forEach(p => formData.append('photos', p));
        formData.append('severity', 'MODERATE'); // Default

        logViolet('POST REQUEST Damage', { url, description, files: photos.length });
        // ApiClient gère le FormData s'il est passé en body
        const res = await apiClient(url, 'POST', formData);
        logViolet('POST RESPONSE Damage', res, 'RES');
        return res;
    },

    /** PUT /api/deliverer/packages/{packageId}/location */
    updateLocation: async (packageId: string, lat: number, lng: number): Promise<any> => {
        const url = `/api/deliverer/packages/${packageId}/location`;
        const body = { latitude: lat, longitude: lng };
        logViolet('PUT REQUEST Location', { url, body });
        const res = await apiClient(url, 'PUT', body);
        logViolet('PUT RESPONSE Location', res, 'RES');
        return res;
    }
};

export { delivererService };