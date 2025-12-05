// FICHIER: src/types/api.ts

// Correspond à `LoginDto`
export interface LoginRequest {
  email: string;
  password: string;
}

// Correspond à `AuthResponseDto`
export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: string;
  email: string;
  accountType: string;
}

// Correspond à `UserRegistrationDto` (Client)
export interface UserRegistrationRequest {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  // Adresse personnelle
  city?: string;
  region?: string;
  country?: string;
  homeAddress?: string;
  homeAddressLocality?: string; // Si dispo dans ton API
  accountType: 'CLIENT'; 
}

export type BusinessActorType = 'FREELANCE' | 'DELIVERER' | 'AGENCY_OWNER' | 'EMPLOYEE';

// Correspond à `BusinessActorRegistrationDto`
// C'est ici qu'il faut être précis pour matcher le script Bash
export interface BusinessActorRegistrationRequest {
  // Info de base User
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  city?: string;
  region?: string;
  country?: string;
  homeAddress?: string;
  
  // Info Business spécifiques
  accountType: 'BUSINESS_ACTOR'; 
  businessActorType: BusinessActorType; // FREELANCE, DELIVERER...
  
  businessName: string;      // Sera le nom du Point Relais ou de l'Agence
  businessAddress?: string;  // Adresse du Point Relais/Agence
  businessLocality?: string; // Quartier du Point Relais
  
  town?: string;             // Ville du business (souvent identique à city)
  cniNumber?: string;
  niu?: string;
}

export interface SuccessResponse {
  message: string;
}