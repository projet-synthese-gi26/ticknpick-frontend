// FICHIER : src/types/index.ts

export interface PackageInfo {
  trackingNumber: string;
  senderName: string; 
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  departurePointName: string;
  arrivalPointName: string;
  packageDescription: string;
  packageWeight: string;
  isFragile: boolean;
  isPerishable: boolean;
  isInsured: boolean;
  declaredValue?: string;
  status: 'Au départ' | 'En transit' | 'Arrivé au relais' | 'Reçu' | 'Annulé';
  estimatedArrivalDate?: string;
  pickupDate?: string;
  retirantName?: string;
  retirantCni?: string;
  retirantCniDate?: string;
  retirantPhone?: string;
  retirantSignature?: string;
  isPaid: boolean;
  shippingCost?: string;
  amountPaid?: string;
  changeAmount?: string;
}

export interface RetirantInfo {
  name: string;
  cni: string;
  cniDate: string;
  phone: string;
}


// 1. Type unifié pour le type de compte
export type AccountType = 'CLIENT' | 'LIVREUR' | 'FREELANCE' | 'AGENCY';

// 2. L'interface UserProfile unifiée avec TOUS les champs possibles (en optionnel)
export interface UserProfile {
  id: string;
  account_type: AccountType;
  manager_name: string | null;
  email?: string | null;
  
  // Champs de base
  created_at?: string;
  phone_number?: string | null;
  birth_date?: string | null;
  nationality?: string | null;
  home_address?: string | null;
  id_card_number?: string | null;

  // Champs PRO
  identity_photo_url?: string | null;
  id_card_url?: string | null;
  tax_id?: string | null;
  professional_experience?: string | null;
  relay_point_name?: string | null;
  relay_point_address?: string | null;
  service_card_details?: any;

  // Champs LIVREUR
  vehicle_type?: string | null;
  vehicle_brand?: string | null;
  // ...ajoutez ici d'autres champs si nécessaire
  
  [key: string]: any;
}

// 3. Le type ProProfile qui est une version spécifique de UserProfile
export interface ProProfile extends UserProfile {
  account_type: 'FREELANCE' | 'AGENCY';
}