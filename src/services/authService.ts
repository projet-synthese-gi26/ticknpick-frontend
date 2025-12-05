// FICHIER: src/services/authService.ts

import apiClient from './apiClient';
import {
  LoginRequest,
  AuthResponse,
  UserRegistrationRequest,
  BusinessActorRegistrationRequest,
} from '@/types/api';

const login = (credentials: LoginRequest): Promise<AuthResponse> => {
  return apiClient<AuthResponse>('/api/auth/login', 'POST', credentials);
};

const registerClient = (userData: UserRegistrationRequest): Promise<any> => {
    return apiClient<any>('/api/auth/register/client', 'POST', userData);
};

const registerBusinessActor = (userData: BusinessActorRegistrationRequest): Promise<any> => {
    let endpoint = '';
    
    // Le mapping ici est crucial pour respecter ton script Bash
    const type = userData.businessActorType;

    switch (type) {
      case 'FREELANCE': // Pour les propriétaires de point relais individuels
        endpoint = '/api/auth/register/freelance';
        break;
      case 'DELIVERER': // Pour les livreurs
        endpoint = '/api/auth/register/deliverer';
        break;
      case 'AGENCY_OWNER': // Pour les propriétaires d'agence
        endpoint = '/api/auth/register/agency-owner';
        break;
      case 'EMPLOYEE': // Pour les employés
         endpoint = '/api/auth/register/employee';
         break;
      default:
        throw new Error(`Type d'acteur professionnel non supporté: ${type}`);
    }

    return apiClient<any>(endpoint, 'POST', userData);
};

export const authService = {
  login,
  registerClient,
  registerBusinessActor,
};