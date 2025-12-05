import apiClient from './apiClient';

// --- INTERFACES DTO ---

// Structure complète d'un Point Relais (telle que reçue du backend)
export interface RelayPoint {
    id: string; // UUID
    ownerId: string; // UUID du owner
    relayPointName: string;
    
    // Gestion des doubles noms possibles (snake_case vs camelCase)
    address?: string;
    relay_point_address?: string;
    
    locality?: string;
    relay_point_locality?: string;
    
    openingHours?: string;
    opening_hours?: string;
    
    maxCapacity: number;
    latitude: number;
    longitude: number;
    
    status?: 'ACTIVE' | 'INACTIVE'; // ou boolean is_active
    is_active: boolean;
    
    daySchedules?: string; // JSON string
    
    // Métadonnées
    createdAt?: string;
    updatedAt?: string;
    current_package_count: number;
}

// Structure pour la création (Payload exact demandé par le backend Java)
interface RelayPointEntityPayload {
    ownerId: string;
    relayPointName: string;
    relay_point_address: string;
    relay_point_locality: string;
    opening_hours: string;
    storage_capacity: string;
    current_package_count: number;
    max_capacity: number;
    latitude: number;
    longitude: number;
    is_active: boolean;
    day_schedules: string;
    createdAt: string; // Obligatoire
    updatedAt: string; // Obligatoire
}

// --- IMPLEMENTATION DU SERVICE ---

const getAllRelayPoints = async (): Promise<RelayPoint[]> => {
    console.log("📦 [RelayPointService] GET All Relay Points...");
    return apiClient<RelayPoint[]>('/api/relay-points', 'GET');
};

const getMyRelayPoints = async (): Promise<RelayPoint[]> => {
    // Note: Si pas d'endpoint /me pour les relais, on filtre côté client ou backend si possible
    // Ici on réutilise getAll, le filtrage se fera dans le composant UI via ownerId
    return apiClient<RelayPoint[]>('/api/relay-points', 'GET');
};

// Fonction utilitaire pour extraire un tableau depuis n'importe quelle réponse API
const extractArray = (response: any): any[] => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    // Gestion Spring Boot PagedModel ou Wrapper personnalisé
    if (response.content && Array.isArray(response.content)) return response.content;
    if (response.data && Array.isArray(response.data)) return response.data;
    if (response.packages && Array.isArray(response.packages)) return response.packages;
    return [];
};

const createRelayPoint = async (data: Partial<RelayPoint>, ownerId: string): Promise<RelayPoint> => {
    if (!ownerId) throw new Error("Owner ID est requis pour créer un point relais");

    const now = new Date().toISOString();

    const payload: RelayPointEntityPayload = {
        ownerId: ownerId,
        relayPointName: data.relayPointName || "Nouveau Point Relais",
        relay_point_address: data.address || data.relay_point_address || "",
        relay_point_locality: data.locality || data.relay_point_locality || "",
        opening_hours: data.openingHours || "08:00-18:00",
        storage_capacity: "MEDIUM", // Valeur par défaut pour l'instant
        current_package_count: 0,
        max_capacity: Number(data.maxCapacity) || 100,
        latitude: Number(data.latitude) || 0.0,
        longitude: Number(data.longitude) || 0.0,
        is_active: true,
        day_schedules: data.daySchedules || JSON.stringify({monday: "08:00-18:00"}),
        createdAt: now,
        updatedAt: now
    };
    
    console.log("📦 [RelayPointService] Creating Relay Point with Payload:", payload);

    const response = await apiClient<RelayPoint>('/api/relay-points', 'POST', payload);
    console.log("✅ [RelayPointService] Created:", response);
    return response;
};

const updateRelayPoint = async (id: string, data: Partial<RelayPoint>): Promise<RelayPoint> => {
    // Utilisation de l'endpoint de management spécifique (PUT /management/{id})
    const payload = {
        relayPointName: data.relayPointName,
        address: data.address || data.relay_point_address,
        locality: data.locality || data.relay_point_locality,
        openingHours: data.openingHours || data.opening_hours,
        maxCapacity: Number(data.maxCapacity),
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        daySchedules: data.daySchedules
    };
    
    console.log(`📦 [RelayPointService] Updating Relay Point ${id}...`, payload);
    return apiClient<RelayPoint>(`/api/relay-points/management/${id}`, 'PUT', payload);
};

// 2. Actions Métier (Dépôt / Expédition)

// "Réceptionner un colis" -> Quand le client dépose le colis au relais (Passe de PRE_REGISTERED à AT_DEPARTURE_RELAY_POINT)
const receivePackage = async (relayPointId: string, packageId: string): Promise<any> => {
    return apiClient<any>(`/api/relay-points/${relayPointId}/packages/${packageId}/receive`, 'POST');
};

// "Expédier un colis" -> Quand le livreur récupère le colis du relais (Optionnel selon ton UI, sinon géré par le livreur)
const dispatchPackage = async (relayPointId: string, packageId: string): Promise<any> => {
    return apiClient<any>(`/api/relay-points/${relayPointId}/packages/${packageId}/dispatch`, 'POST');
};

// 3. Listes filtrées (Inventaire)

// Colis au relais de départ, en attente de départ vers un hub/autre relais
const getPackagesForExpedition = async (relayPointId: string): Promise<any[]> => {
    return apiClient<any[]>(`/api/relay-points/${relayPointId}/packages/for-expedition`, 'GET');
};

// Colis au relais d'arrivée, en attente du client final
const getPackagesForPickup = async (relayPointId: string): Promise<any[]> => {
    return apiClient<any[]>(`/api/relay-points/${relayPointId}/packages/for-pickup`, 'GET');
};

// Liste globale
const getAllPackages = async (relayPointId: string): Promise<any[]> => {
    return apiClient<any[]>(`/api/relay-points/${relayPointId}/packages`, 'GET');
    
};


export const relayPointService = {
    getAllRelayPoints,
    getMyRelayPoints: getAllRelayPoints, // Alias pour compat
    createRelayPoint,
    updateRelayPoint,
    receivePackage,      // NOUVEAU
    dispatchPackage,     // NOUVEAU
    getPackagesForExpedition, // NOUVEAU
    getPackagesForPickup,     // NOUVEAU
    getPackagesByRelayPoint: getAllPackages // Mise à jour de l'existant
};