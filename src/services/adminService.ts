// FICHIER: src/services/adminService.ts
import apiClient from './apiClient';

// --- INTERFACES ---
export interface AdminPackage {
    id: string;
    trackingNumber: string; 
    status: string;
    description: string;
    shippingCost: number;
    createdAt: string;
    updatedAt?: string;
    
    senderName: string;
    recipientName: string;
    departurePointName: string;
    arrivalPointName: string;
    
    weight?: number;
    isFragile?: boolean;
    isInsured?: boolean;
    
    [key: string]: any; 
}

export interface AdminDashboardStats {
    totalUsers: number;
    totalShipments: number;
    totalBusinessActors: number;
    pendingValidations: number;
    totalRevenue: number;
}

// Helper Normalisation
const normalizePackage = (rawPkg: any): AdminPackage => {
    return {
        id: rawPkg.id || rawPkg.packageId || "N/A",
        trackingNumber: rawPkg.trackingNumber || rawPkg.tracking_number || 'N/A',
        status: (rawPkg.status || rawPkg.currentStatus || 'UNKNOWN').toUpperCase(),
        description: rawPkg.description || '',
        shippingCost: Number(rawPkg.shippingCost || rawPkg.deliveryFee || rawPkg.cost || 0),
        createdAt: rawPkg.createdAt || rawPkg.created_at || new Date().toISOString(),
        updatedAt: rawPkg.updatedAt || rawPkg.updated_at,
        
        senderName: rawPkg.senderName || rawPkg.sender_name || 'N/A',
        recipientName: rawPkg.recipientName || rawPkg.recipient_name || 'N/A',
        departurePointName: rawPkg.departurePointName || rawPkg.pickupAddress || rawPkg.departure_relay_point?.name || 'N/A',
        arrivalPointName: rawPkg.arrivalPointName || rawPkg.deliveryAddress || rawPkg.arrival_relay_point?.name || 'N/A',
        
        weight: Number(rawPkg.weight || 0),
        isFragile: Boolean(rawPkg.isFragile),
        isInsured: Boolean(rawPkg.isInsured)
    };
};

// --- CORE: Fetch Sécurisé ---

const getAllShipmentsGlobal = async (): Promise<AdminPackage[]> => {
    console.log("📦 [AdminService] Appel de la route Admin: /api/admin/packages");
    
    try {
        // 1. Route Principale Optimisée
        const response = await apiClient<any>('/api/admin/packages', 'GET');
        
        // Normalisation (gère { content: [] } si Spring Paginator ou Array direct)
        const rawList = Array.isArray(response) ? response : (response?.content || response?.data || []);
        
        if (Array.isArray(rawList) && rawList.length > 0) {
            console.log(`✅ ${rawList.length} colis récupérés via l'admin.`);
            return rawList.map(normalizePackage);
        } 
        
        console.warn("⚠️ Route Admin vide. Pas de colis ou réponse inattendue.");
        return [];

    } catch (error: any) {
        // Gestion d'erreur critique pour éviter de planter le composant React
        console.error("🚨 Erreur récupération colis:", error.message);
        if (error.message.includes('401') || error.message.includes('Session expirée')) {
            // Si 401, on renvoie une erreur typée pour que le frontend puisse logout()
            throw error;
        }
        return []; // En cas d'autre erreur, renvoie liste vide au lieu de crash
    }
};

// --- STATS (Avec protection) ---

const getDashboardStats = async (): Promise<AdminDashboardStats> => {
    // Promise.allSettled est meilleur que Promise.all ici : si une requête échoue, les autres continuent.
    const results = await Promise.allSettled([
        apiClient<any[]>('/api/users', 'GET'), 
        apiClient<any[]>('/api/business-actors', 'GET'),
        getAllShipmentsGlobal()
    ]);

    const users = results[0].status === 'fulfilled' ? results[0].value : [];
    const actors = results[1].status === 'fulfilled' ? results[1].value : [];
    const shipments = results[2].status === 'fulfilled' ? results[2].value : [];

    // Sécurité typage pour stats
    const revenue = Array.isArray(shipments) 
        ? shipments.reduce((sum, p) => sum + (Number(p.shippingCost) || 0), 0) 
        : 0;

    const pending = Array.isArray(actors) 
        ? actors.filter((a: any) => a.isVerified === false).length
        : 0;

    const clientCount = Array.isArray(users) 
        ? users.filter((u: any) => (u.account_type || u.accountType) === 'CLIENT').length
        : 0;

    return {
        totalUsers: clientCount,
        totalBusinessActors: Array.isArray(actors) ? actors.length : 0,
        totalShipments: Array.isArray(shipments) ? shipments.length : 0,
        pendingValidations: pending,
        totalRevenue: revenue
    };
};

const getAllBusinessActors = async () => {
    try {
        const res = await apiClient<any[]>('/api/business-actors', 'GET');
        return Array.isArray(res) ? res : [];
    } catch(e) { return []; }
};

const validateBusinessActor = async (id: string, isValid: boolean) => {
    const actor = await apiClient<any>(`/api/business-actors/${id}`, 'GET');
    // Attention au payload PUT, parfois on n'a besoin que des champs modifiés
    const updated = { ...actor, isVerified: isValid, isEnabled: isValid };
    return apiClient(`/api/business-actors/${id}`, 'PUT', updated);
};

const deleteBusinessActor = async (id: string) => apiClient(`/api/business-actors/${id}`, 'DELETE');

export const adminService = {
    getDashboardStats,
    getAllShipmentsGlobal,
    getAllBusinessActors,
    validateBusinessActor,
    deleteBusinessActor
};