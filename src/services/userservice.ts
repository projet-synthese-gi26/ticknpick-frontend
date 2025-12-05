// FICHIER: src/services/userservice.ts
import apiClient from './apiClient';
import { UserProfile } from '@/app/dashboard/page';

/**
 * Récupère le profil complet de l'utilisateur connecté.
 * GET /api/users/me
 */
const getMyProfile = async (): Promise<any> => {
  console.log("👤 [UserService] Fetching /api/users/me...");
  return apiClient<any>('/api/users/me', 'GET');
};

/**
 * Récupère le profil complet. 
 */
const getProfileById = async (userId: string): Promise<any> => {
  console.log(`👤 [UserService] Step 1: Fetching base User /api/users/${userId}...`);
  
  // 1. Récupération Base User
  const baseUser = await apiClient<any>(`/api/users/${userId}`, 'GET');
  
  // Normalisation préliminaire du type
  const type = baseUser.account_type || baseUser.accountType || 'CLIENT';

  if (type === 'BUSINESS_ACTOR') {
      console.log(`👤 [UserService] Step 2: Business Actor detected. Attempting to fetch details...`);
      try {
          const businessDetails = await apiClient<any>(`/api/business-actors/${userId}`, 'GET');
          
          console.log("✅ [UserService] Business details merged.");
          return { 
            ...baseUser, 
            ...businessDetails, // Priorité aux détails business
            account_type: type 
          };

      } catch (err: any) {
          // --- BLOC DE RÉCUPÉRATION D'ERREUR ---
          console.warn(`⚠️ [UserService] Failed to fetch Business Details (Error ${err.message}). Using Fallback.`);
          
          // Si 404, cela veut dire que l'User existe mais pas son entrée BusinessActor spécifique.
          // C'est une incohérence de BDD, mais on ne doit pas bloquer le front.
          
          // On renvoie l'utilisateur de base, mais on force un type business générique
          // pour que le dashboard s'affiche quand même (mode dégradé)
          return {
              ...baseUser,
              account_type: 'BUSINESS_ACTOR',
              business_actor_type: 'FREELANCE', // Valeur par défaut safe
              businessName: baseUser.name || 'Business (Non Configuré)'
          };
      }
  }

  return baseUser;
};

/**
 * Met à jour le profil (Text Only - les photos sont gérées avant).
 */
const updateUser = async (userId: string, data: Partial<UserProfile>): Promise<any> => {
  console.log(`💾 [UserService] Updating /api/users/${userId}...`, data);
  return apiClient<any>(`/api/users/${userId}`, 'PUT', data);
};

export const userService = {
  getMyProfile,
  getProfileById,
  updateUser
};