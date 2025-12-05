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
 * Stratégie de fusion : User + BusinessActor
 */
const getProfileById = async (userId: string): Promise<any> => {
  console.log(`👤 [UserService] Step 1: Fetching base User /api/users/${userId}...`);
  
  // 1. Récupération des infos de base (Table User)
  let baseUser: any;
  try {
    baseUser = await apiClient<any>(`/api/users/${userId}`, 'GET');
  } catch (e) {
    // Si erreur user, on propage
    throw e;
  }

  // 2. Si c'est un Business Actor, on va chercher les infos complémentaires
  // Note: Le backend peut renvoyer "account_type" (snake) ou "accountType" (camel)
  const type = baseUser.account_type || baseUser.accountType;

  if (type === 'BUSINESS_ACTOR') {
      console.log(`👤 [UserService] Step 2: User is Business, fetching details /api/business-actors/${userId}...`);
      try {
          // On suppose que l'ID est partagé (stratégie @Inheritance(JOINED) courante en Java)
          const businessDetails = await apiClient<any>(`/api/business-actors/${userId}`, 'GET');
          
          console.log("✅ [UserService] Business details found, merging...");
          
          // 3. FUSION : On écrase les données de base par les données précises du BusinessActor
          // Cela permet d'avoir 'businessActorType', 'businessName', etc.
          return { 
            ...baseUser, 
            ...businessDetails,
            // Sécurisation des champs pour qu'ils soient au format attendu par l'UI
            account_type: type,
            // On s'assure que businessActorType est remonté
            business_actor_type: businessDetails.businessActorType || businessDetails.business_actor_type,
            name: businessDetails.businessName || businessDetails.name || baseUser.name
          };

      } catch (err) {
          console.warn("⚠️ Impossible de récupérer les détails Business (Probable ID mismatch ou pas encore créé)", err);
          // Si ça échoue, on renvoie au moins l'utilisateur de base pour ne pas planter l'app
          return baseUser;
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