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

// Nouvelle interface pour le retour du paiement
export interface PaymentProcessResponse {
    message: string;
    status: string;
    transactionId?: string;
}

// --- Types DTO pour création de Colis ---
export interface PackageCreationPayload {
  // Infos techniques obligatoires
  pickupAddress: string;
  deliveryAddress: string;
  departureRelayPointId: string;
  arrivalRelayPointId: string;
  
  // Destinataire
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  
  // Détails Colis
  packageType: string;
  weight: number;
  dimensions: string; // JSON stringifié
  description: string;
  value: number; // Valeur déclarée (Assurance)
  
  // Financier & Logistique
  deliveryOption: string;
  deliveryFee: number;
  specialInstructions: string;

  // -- INFO EXPÉDITEUR --
  // Bien que le backend utilise souvent le token utilisateur, 
  // on envoie explicitement ces champs pour forcer la mise à jour 
  // si le formulaire diffère du profil utilisateur ou pour l'historique.
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
  senderEmail?: string; 
}

// Interface complète selon la documentation Swagger
export interface FullPackageDetails {
    id: string;
    trackingNumber: string;
    status: string;
    description: string;
    weight: number;
    width?: number;
    length?: number;
    height?: number;
    dimensions?: string; // Parfois retourné en JSON string
    shippingCost: number;
    value?: number;
    packageType: string;
    isFragile: boolean;
    isPerishable: boolean;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
    specialInstructions?: string;
    
    // Relations étendues
    senderName: string;
    senderPhone: string;
    senderAddress?: string; // Si dispo
    
    recipientName: string;
    recipientPhone: string;
    recipientAddress: string;

    pickupAddress?: string;
    deliveryAddress?: string;
    
    departurePointName?: string;
    arrivalPointName?: string;
    
    // Historique ou métadonnées supplémentaires
    history?: any[]; 
}


export interface CreatePackageResponse {
  id: string;
  trackingNumber: string;
  status: string;
  shippingCost: number;
}


// === SERVICES ===

const createPackage = async (payload: PackageCreationPayload): Promise<CreatePackageResponse> => {
  // Transformation potentielle des données avant envoi si nécessaire
  console.log("📤 Sending Package Creation Payload:", payload);
  
  // Endpoint POST standard
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


const processPayment = async (packageId: string, paymentData: any): Promise<any> => {
    return apiClient<any>(`/api/payments/process/${packageId}`, 'POST', paymentData);
};

// --- AJOUT DE CETTE FONCTION ---
const getPackageById = async (packageId: string): Promise<FullPackageDetails> => {
    const url = `/api/packages/${packageId}`;
    console.log(`%c🚀 [REQUEST] GET ${url}`, 'color: #0ea5e9; font-weight: bold;');
    
    try {
        const response = await apiClient<FullPackageDetails>(url, 'GET');
        
        console.log(`%c✅ [RESPONSE] Details for ${packageId}:`, 'color: #22c55e; font-weight: bold;');
        console.log(response); // Le log complet de l'objet
        
        return response;
    } catch (error) {
        console.error(`%c❌ [ERROR] GET ${url}`, 'color: #ef4444; font-weight: bold;', error);
        throw error;
    }
};


export const packageService = {
  createPackage,
  trackPackage,
  getMyPackages,
  getPackageById, // NOUVEAU
  getPackagesByRelayPoint,
  markAsDelivered, // NOUVEAU
  getPackageByTracking,
  processPayment, // NOUVEAU
};