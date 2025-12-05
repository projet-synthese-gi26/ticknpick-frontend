import apiClient from './apiClient';

// Interface DTO Backend pour un Colis (Lecture)
export interface BackendPackage {
    id: string;
    trackingNumber?: string;
    status: string;
    shippingCost?: number;
    description?: string;
    weight?: number;
    createdAt?: string;
    updatedAt?: string;
    
    // Relations
    departurePointId?: string;
    arrivalPointId?: string;
    departurePointName?: string; // Noms enrichis par le backend
    arrivalPointName?: string;

    senderName?: string;
    senderPhone?: string;
    recipientName?: string;
    recipientPhone?: string;
}

// Interface DTO pour la Création (POST)
// Correspond strictement au JSON attendu par votre Backend
export interface PackageCreationPayload {
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  
  pickupAddress: string;    // Adresse Départ
  deliveryAddress: string;  // Adresse Arrivée
  
  packageType: string;      // STANDARD, FRAGILE...
  weight: number;
  dimensions: string;       // JSON Stringify: "{\"length\":...}"
  description: string;
  value: number;
  
  deliveryOption: string;   // RELAY_POINT_DELIVERY par défaut
  
  departureRelayPointId: string; // UUID
  arrivalRelayPointId: string;   // UUID
  
  specialInstructions: string;
  deliveryFee: number;
}

export interface CreatePackageResponse {
  id?: string;
  trackingNumber: string;
  status: string;
}

// === SERVICES ===

const createPackage = async (payload: PackageCreationPayload): Promise<CreatePackageResponse> => {
  return apiClient<CreatePackageResponse>('/api/packages', 'POST', payload);
};

const trackPackage = async (trackingNumber: string): Promise<BackendPackage> => {
  // On encode pour éviter les erreurs si le tracking contient des "/" ou espaces
  const safeId = encodeURIComponent(trackingNumber.trim());
  return apiClient<BackendPackage>(`/api/packages/tracking/${safeId}`, 'GET');
};

const getMyPackages = async (): Promise<BackendPackage[]> => {
  return apiClient<BackendPackage[]>('/api/packages/my-packages', 'GET');
};

// Rechercher un colis (tracking)
const getPackageByTracking = async (trackingNumber: string): Promise<any> => {
    return apiClient<any>(`/api/packages/tracking/${trackingNumber}`, 'GET');
};

// "Marquer comme livré" -> Quand le client retire le colis (Passe à WITHDRAWN/RECU)
const markAsDelivered = async (packageId: string): Promise<any> => {
    return apiClient<any>(`/api/packages/${packageId}/deliver`, 'PUT');
};


// (Pour l'inventaire pro, on garde getPackagesByRelayPoint ici si besoin, déjà traité)
const getPackagesByRelayPoint = async (id: string) => apiClient(`/api/packages/relay-point/${id}`, 'GET');

export const packageService = {
  createPackage,
  trackPackage,
  getMyPackages,
  getPackagesByRelayPoint,
  markAsDelivered, // NOUVEAU
  getPackageByTracking,
};