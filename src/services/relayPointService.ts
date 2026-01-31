// FICHIER: src/services/relayPointService.ts
import apiClient from './apiClient';

// --- TYPES ---
export interface RelayPoint {
    id: string; 
    ownerId: string;
    relayPointName: string;
    address?: string;
    relay_point_address?: string;
    locality?: string;
    relay_point_locality?: string;
    openingHours?: string;
    maxCapacity: number;
    latitude: number;
    longitude: number;
    status: string; // 'DRAFT', 'PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'TEMPORARILY_CLOSED', 'DEACTIVATED'
    is_active: boolean;
    current_package_count: number;
    documents?: any;
    photoUrl?: string;
    contactPhone?: string;
}

// =============================================================================
// ACTIONS PROPRIÉTAIRE & CRÉATION (Flux Inscription -> Validation)
// =============================================================================

/**
 * 1. Création (Propriétaire)
 * POST /api/relay-points
 */
const createRelayPoint = async (data: any, ownerId?: string): Promise<RelayPoint> => {
    const payload = { ...data, ownerId };
    console.log("📤 Création Point Relais:", payload);
    return apiClient<RelayPoint>('/api/relay-points', 'POST', payload);
};

/**
 * 2. Upload Photo (Propriétaire / Admin)
 * POST /api/relay-points/{relayPointId}/photo/upload
 */
const uploadRelayPhoto = async (relayPointId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    // Note : apiClient gère le content-type multipart si body est FormData
    return apiClient(`/api/relay-points/${relayPointId}/photo/upload`, 'POST', fd);
};

/**
 * 3. Upload Documents (Propriétaire / Admin)
 * POST /api/relay-points/{relayPointId}/documents/upload
 */
const uploadRelayDocument = async (relayPointId: string, file: File, docType: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', docType);
    return apiClient(`/api/relay-points/${relayPointId}/documents/upload`, 'POST', fd);
};

/**
 * 4. Soumettre pour vérification (Propriétaire)
 * POST /api/relay-points/{relayPointId}/submit-verification
 */
const submitForVerification = async (relayId: string) => {
    return apiClient(`/api/relay-points/${relayId}/submit-verification`, 'POST');
};

// =============================================================================
// ACTIONS ADMIN (Gestion du Cycle de Vie)
// =============================================================================

// Validation
const approveRelayPoint = async (relayPointId: string) => apiClient(`/api/relay-points/${relayPointId}/approve`, 'POST');
const rejectRelayPoint = async (relayPointId: string, reason: string) => apiClient(`/api/relay-points/${relayPointId}/reject`, 'POST', { reason });

// Activation / Désactivation
const activateRelayPoint = async (relayPointId: string) => apiClient(`/api/relay-points/${relayPointId}/activate`, 'POST');
const deactivateRelayPoint = async (relayPointId: string, reason?: string) => apiClient(`/api/relay-points/${relayPointId}/deactivate`, 'POST', { reason });

// Suspension
const suspendRelayPoint = async (relayPointId: string, reason?: string) => apiClient(`/api/relay-points/${relayPointId}/suspend`, 'POST', { reason });
const liftSuspension = async (relayPointId: string) => apiClient(`/api/relay-points/${relayPointId}/lift-suspension`, 'POST');

// Fermeture Temporaire / Réouverture
const closeTemporarily = async (relayPointId: string, reason?: string) => apiClient(`/api/relay-points/${relayPointId}/close-temporarily`, 'POST', { reason });
const reopenRelayPoint = async (relayPointId: string) => apiClient(`/api/relay-points/${relayPointId}/reopen`, 'POST');

// =============================================================================
// LECTURE & RECHERCHE (Admin & Public)
// =============================================================================

const getAllRelayPoints = async () => apiClient<RelayPoint[]>('/api/relay-points', 'GET');
const getRelayPointById = async (id: string) => apiClient<RelayPoint>(`/api/relay-points/${id}`, 'GET');
const getRelayStats = async () => apiClient<any>('/api/relay-points/stats', 'GET'); 
const getGlobalStatistics = async () => apiClient<any>('/api/relay-points/statistics', 'GET'); 

const searchRelayPoints = async (query: string) => apiClient<RelayPoint[]>(`/api/relay-points/search?q=${query}`, 'GET');

// FILTRES PAR STATUT (Admin)
const getPointsByStatus = async (status: string) => {
    // Mapping des status vers les endpoints fournis
    const endpointMap: Record<string, string> = {
        'VERIFIED': '/api/relay-points/status/verified',
        'PENDING_VERIFICATION': '/api/relay-points/status/pending-verification',
        'PENDING_DOCUMENTS': '/api/relay-points/status/pending-documents',
        'DRAFT': '/api/relay-points/status/draft',
        'ACTIVE': '/api/relay-points/status/active',
        'ALL': '/api/relay-points/status/all' 
    };
    
    const url = endpointMap[status] || `/api/relay-points/status/${status.toLowerCase()}`;
    return apiClient<RelayPoint[]>(url, 'GET');
};

const getPendingVerification = async () => apiClient<RelayPoint[]>('/api/relay-points/pending-verification', 'GET');

// =============================================================================
// CRUD BASIQUE & COMPATIBILITÉ
// =============================================================================

const updateRelayPoint = async (id: string, data: any) => apiClient(`/api/relay-points/${id}`, 'PUT', data);
const deleteRelayPoint = async (id: string) => apiClient(`/api/relay-points/${id}`, 'DELETE');

// Fonctions placeholder pour la compatibilité existante (colis)
const getPackagesForExpedition = async (id?: string) => [];
const receivePackage = async (relayId: string, packageId: string) => {}; 
const dispatchPackage = async (relayId: string, packageId: string) => {}; 
const markReceivedAtDestination = async (packageId: string) => {}; 
const handToRecipient = async (packageId: string, code: string) => {}; 
const getMyRelayInventory = async () => []; 
const getPackagesIncoming = async () => [];
const getPackagesForPickup = async () => [];

// Alias de filtrage client si l'endpoint backend n'existe pas
const getRelayPointsByOwner = async (ownerId: string) => getAllRelayPoints(); 

export const relayPointService = {
    createRelayPoint,
    uploadRelayPhoto,
    uploadRelayDocument,
    submitForVerification,
    approveRelayPoint,
    rejectRelayPoint,
    activateRelayPoint,
    deactivateRelayPoint,
    suspendRelayPoint,
    liftSuspension,
    closeTemporarily,
    reopenRelayPoint,
    getAllRelayPoints,
    getRelayPointById,
    getRelayStats,
    getGlobalStatistics,
    searchRelayPoints,
    getPointsByStatus,
    getPendingVerification,
    updateRelayPoint,
    deleteRelayPoint,
    getRelayPointsByOwner,
    
    // Alias pour ne pas casser le reste (à implémenter ou garder tel quel si autre fichier)
    getPackagesForExpedition, receivePackage, dispatchPackage, markReceivedAtDestination, 
    handToRecipient, getMyRelayInventory, getPackagesIncoming, getPackagesForPickup
};