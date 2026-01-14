// FICHIER: src/services/userservice.ts
import apiClient from './apiClient';
import { UserProfile } from '@/app/dashboard/page';
import { employeeService } from './employeeService';
import { agencyService } from './agencyService';

/**
 * Récupère le profil complet de l'utilisateur connecté.
 * GET /api/users/me
 */
const getMyProfile = async (): Promise<any> => {
  console.log("👤 [UserService] Fetching /api/users/me...");
  return apiClient<any>('/api/users/me', 'GET');
};
/**
 * Récupère le profil complet avec enrichissement pour les Employés.
 */
const getProfileById = async (userId: string): Promise<any> => {
  console.group(`👤 [UserService] Construction Profil Complet pour : ${userId}`);

  try {
      // 1. Récupération Base User (/api/users/{id})
      // Note: On pourrait aussi utiliser /me ici si l'ID correspond, mais garder l'ID est plus générique.
      const baseUser = await apiClient<any>(`/api/users/${userId}`, 'GET');
      console.log("1️⃣ Infos Utilisateur récupérées:", baseUser.name);

      let businessDetails: any = {};
      let finalAccountType = baseUser.account_type || baseUser.accountType || 'CLIENT';
      
      // On vérifie le type de compte dans la réponse baseUser
      const userTypeUpper = (finalAccountType).toUpperCase();
      const subType = (baseUser.businessActorType || '').toUpperCase();

      // Si c'est un Employé ou un acteur business
      if (userTypeUpper === 'BUSINESS_ACTOR' || subType === 'EMPLOYEE') {
          
          // 2. Récupération détails Acteur Business
          const actorDetails = await apiClient<any>(`/api/business-actors/${userId}`, 'GET');
          businessDetails = { ...actorDetails };
          
          const actorType = (businessDetails.businessActorType || subType).toUpperCase();

          // === LOGIQUE CIBLÉE POUR L'EMPLOYÉ ===
          if (actorType === 'EMPLOYEE') {
              console.log("2️⃣ C'est un Employé. Recherche fiche technique...");

              // 3. Récupérer la fiche technique Employé pour avoir l'ID Agence
              const empDetails = await employeeService.getEmployeeByUserId(userId);
              
              if (empDetails && empDetails.agencyId) {
                  const agencyId = empDetails.agencyId;
                  businessDetails.agency_id = agencyId;
                  
                  console.log(`3️⃣ ID Agence trouvé: ${agencyId}. Lancement Vérification...`);

                  // 4. LA ROUTE MAGIQUE : Verification sur l'agence
                  // Cette route utilise le token de l'user connecté pour savoir quel relay lui donner
                  const verificationData = await agencyService.getAgencyVerification(agencyId);

                  // 5. Extraction du Relay Point ID depuis la réponse de verification
                  // On suppose que la réponse contient { relayPointId: "..." } ou similaire
                  const verifiedRelayId = verificationData?.relayPointId || verificationData?.assignedRelayId;

                  if (verifiedRelayId) {
                      console.log(`4️⃣ 🎯 Point Relais IDENTIFIÉ via verification: ${verifiedRelayId}`);
                      
                      // On force les props pour que le Dashboard affiche la vue "Point Relais" (Freelance/Owner view)
                      // mais avec les données de CE relais spécifique.
                      businessDetails.assigned_relay_point_id = verifiedRelayId;
                      finalAccountType = 'FREELANCE'; 
                      
                      // On injecte aussi les infos brutes au cas où
                      businessDetails.verificationData = verificationData;
                  } else {
                      console.warn("⚠️ Pas de RelayPointId retourné par /verification");
                  }
              }
          }
      }

      console.groupEnd();
      
      // Construction de l'objet final pour l'app
      return { 
        ...baseUser, 
        ...businessDetails, 
        account_type: finalAccountType // Sera 'FREELANCE' si un relais a été trouvé, déclenchant l'UI FreelanceOverview
      };

  } catch (err) {
      console.error("❌ Erreur Fatale UserService:", err);
      console.groupEnd();
      throw err;
  }
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