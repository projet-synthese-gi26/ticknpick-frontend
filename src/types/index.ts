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