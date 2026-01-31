// FICHIER: src/services/relayPointService.ts

import apiClient from './apiClient';

// --- TYPES & INTERFACES ---

export interface RelayPoint {
    id: string; // UUID
    ownerId: string;
    agency_id?: string;
    relayPointName: string;
    address?: string;
    relay_point_address?: string; // Fallback naming
    locality?: string;
    relay_point_locality?: string; // Fallback naming
    openingHours?: string;
    maxCapacity: number;
    latitude: number;
    longitude: number;
    is_active: boolean;
    current_package_count: number;
}

export interface RelayPackage {
    id: string;
    trackingNumber: string;
    status: string;
    description: string;
    shippingCost: number;
    senderName: string;
    recipientName: string;
    createdAt: string;
    packageType?: string;
}

// --- IMPLEMENTATION DES ENDPOINTS MÉTIERS (Ton nouveau Flow) ---

// 1. RECEPTIONNER (Dépôt Client OU Arrivée Livreur au hub)
// Route: POST /api/relay-point/packages/{packageId}/receive
const receivePackage = async (packageId: string): Promise<any> => {
    return apiClient(`/api/relay-point/packages/${packageId}/receive`, 'POST');
};

// 2. PRÉPARER POUR DÉPART (Vers Livreur)
// Route: POST /api/relay-point/packages/{packageId}/ready-for-dispatch
const markReadyForDispatch = async (packageId: string): Promise<any> => {
    return apiClient(`/api/relay-point/packages/${packageId}/ready-for-dispatch`, 'POST');
};

// 3. PRÉPARER POUR RETRAIT (Vers Client Destinataire)
// Route: POST /api/relay-point/packages/{packageId}/ready-for-pickup
const markReadyForPickup = async (packageId: string): Promise<any> => {
    return apiClient(`/api/relay-point/packages/${packageId}/ready-for-pickup`, 'POST');
};

// 4. REMETTRE AU CLIENT (Finalisation)
// Route: POST /api/relay-point/packages/{packageId}/hand-to-recipient
const handoverToRecipient = async (packageId: string, pickupCode: string): Promise<any> => {
    // On passe souvent le code en query param ou body, ici adapté à ta demande simple
    return apiClient(`/api/relay-point/packages/${packageId}/hand-to-recipient`, 'POST', { pickupCode });
};

// --- IMPLEMENTATION DATA FETCHING (Inventaires) ---

/**
 * Récupère tous les colis PHYSQIUEMENT PRÉSENTS au point relais
 * Route: GET /api/relay-point/packages
 */
const getMyRelayInventory = async (): Promise<RelayPackage[]> => {
    try {
        const res = await apiClient<any>('/api/relay-point/packages', 'GET');
        return extractArray(res);
    } catch (e) {
        console.error("Erreur inventaire global:", e);
        return [];
    }
};

/**
 * Récupère les colis EN ARRIVAGE (venant d'un livreur vers ce relais)
 * Route: GET /api/relay-point/packages/awaiting-arrival
 */
const getPackagesIncoming = async (): Promise<RelayPackage[]> => {
    try {
        const res = await apiClient<RelayPackage[]>('/api/relay-point/packages/awaiting-arrival', 'GET');
        return extractArray(res);
    } catch (e) { return []; }
};

/**
 * Récupère les colis PRE-ENREGISTRÉS par les clients (à déposer)
 * Route: GET /api/relay-point/packages/to-deposit
 */
const getPackagesToDeposit = async (): Promise<RelayPackage[]> => {
    try {
        const res = await apiClient<RelayPackage[]>('/api/relay-point/packages/to-deposit', 'GET');
        return extractArray(res);
    } catch (e) { return []; }
};

// --- UTILITAIRES & GENERIQUES ---

const getAllRelayPoints = async (): Promise<RelayPoint[]> => {
    const res = await apiClient<RelayPoint[]>('/api/relay-points', 'GET');
    return extractArray(res);
};

// C'est la fonction qui te manquait dans l'erreur !
const getRelayPointById = async (id: string): Promise<RelayPoint> => {
    return apiClient<RelayPoint>(`/api/relay-points/${id}`, 'GET');
};

// Utilitaires de conversion pour extraire les tableaux des réponses paginées/wrapper
const extractArray = (response: any): any[] => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (response.content && Array.isArray(response.content)) return response.content;
    if (response.data && Array.isArray(response.data)) return response.data;
    if (response.packages && Array.isArray(response.packages)) return response.packages;
    return [];
};

/**
 * 1. Créer un nouveau Point Relais (Pour un owner existant ou via le profil agence)
 * Route : POST /api/relay-points
 */
const createRelayPoint = async (data: any, ownerId?: string): Promise<RelayPoint> => {
    // Si ownerId est fourni, on peut l'injecter dans le body ou le backend le tire du token
    const payload = {
        ...data,
        ownerId: ownerId // Optionnel si le token suffit
    };
    
    console.log("📤 Création Point Relais:", payload);
    return apiClient<RelayPoint>('/api/relay-points', 'POST', payload);
};


/**
 * 2. Soumettre le point relais à l'admin pour vérification (Après création + upload documents)
 * Route : POST /api/relay-points/{relayPointId}/submit-verification
 */
const submitForVerification = async (relayId: string): Promise<any> => {
    console.log(`📤 [RelayService] Submission pour validation : ${relayId}`);
    return apiClient(`/api/relay-points/${relayId}/submit-verification`, 'POST');
};

/**
 * 3. L'Admin Approuve
 * Route : POST /api/relay-points/{relayPointId}/approve
 * Fix: Ajout du body JSON requis par le Backend
 */
const approveRelayPoint = async (relayId: string, notes: string = "Validation Admin"): Promise<any> => {
    // Le backend attend un RelayPointVerificationRequest en JSON
    const payload = {
        verificationNotes: notes,
        canResubmit: false // Champ souvent attendu par le DTO backend pour l'approbation
    };
    return apiClient(`/api/relay-points/${relayId}/approve`, 'POST', payload);
};

/**
 * 4. L'Admin Rejette
 * Route : POST /api/relay-points/{relayPointId}/reject
 * Fix: Standardisation des noms de champs
 */
const rejectRelayPoint = async (relayId: string, reason: string): Promise<any> => {
    const payload = {
        verificationNotes: reason, // Le DTO backend mappe souvent 'verificationNotes'
        rejectionReason: reason,   // On envoie aussi celui-ci par sécurité si le nom diffère
        canResubmit: true
    };
    return apiClient(`/api/relay-points/${relayId}/reject`, 'POST', payload);
};

// ... (Gardez vos autres méthodes : getMyRelayInventory, getAllRelayPoints, etc.) ...

/**
 * Récupère les points en attente (Côté Admin)
 * Route : GET /api/relay-points/pending-verification
 */
const getPendingRelayPoints = async (): Promise<RelayPoint[]> => {
    const res = await apiClient<RelayPoint[]>('/api/relay-points/pending-verification', 'GET');
    // Gestion de la réponse si elle est encapsulée (ex: { content: [...] })
    if (res && (res as any).content) return (res as any).content;
    return Array.isArray(res) ? res : [];
};


// Autres aliases nécessaires pour ne pas casser le reste de l'app
const updateRelayPoint = async (id: string, data: any) => apiClient(`/api/relay-points/${id}`, 'PUT', data);

// Fonctions alias pour éviter de casser 'FreelanceOverview.tsx'
const getPackagesForExpedition = async (id: string) => getMyRelayInventory(); // Fallback temporaire
const getPackagesForPickup = async (id: string) => getMyRelayInventory(); // Fallback temporaire
const getRelayPointsByOwner = async (id: string) => getAllRelayPoints(); // Filter logic coté client souvent

export const relayPointService = {
    // Méthodes Flow Validées
    receivePackage,
    markReadyForDispatch,
    markReadyForPickup,
    handoverToRecipient,

    // Listes Spécifiques
    getMyRelayInventory,
    getPackagesIncoming,
    getPackagesToDeposit,
    submitForVerification,

    // Generic / Admin
    getAllRelayPoints,
    getRelayPointById,
    createRelayPoint,
    updateRelayPoint,
    rejectRelayPoint,
    approveRelayPoint,
    getPendingRelayPoints,

    // Alias pour rétrocompatibilité
    getPackagesForExpedition,
    getPackagesForPickup,
    getRelayPointsByOwner,
    getPackagesByRelayPoint: getMyRelayInventory
};