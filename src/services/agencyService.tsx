// FICHIER: src/services/agencyService.ts
import apiClient from './apiClient';
import { relayPointService, RelayPoint } from './relayPointService'; // Import pour utiliser les types existants

// --- Types (Mises à jour pour tolérer snake_case et camelCase) ---
export interface Agency {
  id: string;
  owner_id?: string;
  ownerId?: string; // Support double
  commercial_name?: string;
  commercialName?: string;
  address: string;
  address_locality?: string;
  opening_hours?: string;
  photo_url?: string;
  employee_count?: number;
  business_registration?: string;
  is_enabled?: boolean;
  relay_points?: any[]; 
  documents?: any;
  service_card_details?: any;
}

export interface AgencyCreationPayload {
  commercialName: string;
  address: string;
  addressLocality?: string;
  openingHours?: string;
  employeeCount?: number;
  businessRegistration?: string;
  photoUrl?: string;
  documents?: string; // JSON stringifié
}

export interface Employee {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  role: string[]; // ['GERANT', 'LIVREUR']
  assigned_relay_point_id?: string;
  agency_id: string;
  photo_url?: string;
  status: string; // ACTIVE, INACTIVE
  created_at: string;
  performance?: {
    parcels_processed: number;
    success_rate: number;
  }
}

// Interface combinée (Employee Relation + User Details)
export interface DetailedEmployee {
  id: string;             // ID technique (Employee table)
  userId: string;         // ID User (Auth/User table)
  name: string;
  email: string;
  phone: string;
  role: string[];         // Ex: ['LIVREUR']
  photo_url: string | null;
  status: string;         // 'ACTIF', 'INACTIF'
  agency_id: string;
  assigned_relay_point_id?: string;
  created_at: string;
  
  // Champs additionnels potentiels du User
  cni_number?: string;
  address?: string;
}

export interface AgencyStats {
    relayPointsCount: number;
    employeesCount: number;
    packagesCount: number;
}

/**
 * 1. Récupère l'agence via l'ID du propriétaire (Agency Owner)
 * Gère le format { agencies: [...] } renvoyé par le backend
 */
const getAgencyByOwnerId = async (ownerId: string): Promise<Agency | null> => {
  console.log(`🏢 [AgencyService] Fetching Agency for Owner: ${ownerId}`);
  try {
      const response: any = await apiClient(`/api/agencies/owner/${ownerId}`, 'GET');
      
      console.log("🔍 [AgencyService] Raw Response:", response);

      // CAS 1: Le backend retourne un wrapper { agencies: [...] } (Cas observé dans vos logs)
      if (response && Array.isArray(response.agencies) && response.agencies.length > 0) {
          const found = response.agencies[0];
          console.log("✅ [AgencyService] Agence extraite du tableau 'agencies':", found.commercial_name);
          return found;
      }

      // CAS 2: Le backend retourne un tableau direct [...]
      if (Array.isArray(response)) {
          return response[0] || null;
      }

      // CAS 3: Le backend retourne l'objet directement { id: ... }
      if (response && response.id) {
          return response;
      }

      return null;
  } catch (e: any) {
      console.warn("⚠️ Aucune agence trouvée pour ce propriétaire (404 ou vide)");
      return null;
  }
};

const getAgencyRelayPoints = async (agencyId: string): Promise<any[]> => {
    console.group(`📦 [AgencyService] GET /api/agencies/${agencyId}/relay-points`);
    try {
        const res: any = await apiClient(`/api/agencies/${agencyId}/relay-points`, 'GET');
        console.log("🔍 Réponse brute:", res);
        
        // Extraction robuste
        // Ton backend peut renvoyer directement le tableau ou un wrapper
        const list = Array.isArray(res) 
            ? res 
            : (res.relayPoints || res.relay_points || res.content || []);
            
        console.log(`✅ ${list.length} Relay Points extraits.`);
        console.groupEnd();
        return list;
    } catch (e) {
        console.error("❌ Erreur Fetch Relay Points", e);
        console.groupEnd();
        return [];
    }
};

const getAgencyEmployees = async (agencyId: string): Promise<any[]> => {
    console.log(`👥 [AgencyService] GET Employees for Agency ${agencyId}`);
    try {
        const res: any = await apiClient(`/api/agencies/${agencyId}/employees`, 'GET');
        
        // CORRECTION ICI : Extraction du tableau depuis 'employees'
        // Le log montrait { count: 3, employees: [...] }
        const rawList = Array.isArray(res) 
            ? res 
            : (res.employees || []);

        console.log(`🔍 Raw employees found: ${rawList.length}`);

        // Hydratation (Optionnelle, seulement si nécessaire pour avoir les détails User)
        const hydrated = await Promise.all(rawList.map(async (emp: any) => {
            // Si le nom est manquant, on le cherche dans User, sinon on garde tel quel
            if (!emp.name && (emp.userId || emp.user_id)) {
                 const uid = emp.userId || emp.user_id;
                 try { 
                     const userData = await apiClient<any>(`/api/users/${uid}`, 'GET'); 
                     return { ...emp, ...userData, id: emp.id }; // Garder l'ID employé
                 } catch(e) { return emp; }
            }
            return emp;
        }));
        
        console.log(`✅ ${hydrated.length} Employees hydrated.`);
        return hydrated;

    } catch (e) { 
        console.error("❌ Erreur GetAgencyEmployees", e); 
        return []; 
    }
};



/**
 * Alternative : Récupère les points relais par le owner ID directement
 * Route : GET /api/agencies/owner/{ownerId}/relay-points
 */
const getRelayPointsByOwner = async (ownerId: string): Promise<RelayPoint[]> => {
    try {
        return await apiClient<RelayPoint[]>(`/api/agencies/owner/${ownerId}/relay-points`, 'GET');
    } catch (e) {
        console.error("Erreur Fetch Relay Points Owner", e);
        return [];
    }
};


/**
 * 4. Assigner un employé (manager) à un point relais
 * Route : POST /api/agencies/{agencyId}/relay-points/{relayPointId}/manager/{employeeUserId}
 */
const assignManagerToRelay = async (agencyId: string, relayPointId: string, employeeUserId: string) => {
    console.group(`🔗 [AgencyService] Assignation Manager`);
    
    // Construction de l'URL avec les 3 IDs
    const endpoint = `/api/agencies/${agencyId}/relay-points/${relayPointId}/manager/${employeeUserId}`;
    console.log(`📡 Requête : POST ${endpoint}`);

    try {
        const response = await apiClient<any>(endpoint, 'POST');
        console.log("✅ Succès Assignation:", response);
        return response;
    } catch (error: any) {
        console.error("❌ Erreur Assignation:", error);
        throw error;
    } finally {
        console.groupEnd();
    }
};


/**
 * 5. Ajout d'un employé à l'agence (Lien simple)
 * Route : POST /api/agencies/{agencyId}/employees/{employeeUserId}
 */
const assignEmployeeToAgency = async (agencyId: string, employeeUserId: string, role: string = 'GENERAL') => {
    // Note: query params pour le role souvent
    return apiClient(
        `/api/agencies/${agencyId}/employees/${employeeUserId}?role=${role}`, 
        'POST'
    );
};

/**
 * 6. Vérification statut agence
 * Route : GET /api/agencies/{agencyId}/verification
 */
const verifyAgencyStatus = async (agencyId: string) => {
    return apiClient(`/api/agencies/${agencyId}/verification`, 'GET');
};


// Aggrégateur de colis global pour l'agence
// L'API ne donne pas "/api/agencies/{id}/packages". 
// Nous devons récupérer tous les relais, puis appeler "getPackagesByRelayPoint" pour chaque relais
const getAllAgencyPackages = async (agencyId: string): Promise<any[]> => {
    try {
        const relays = await getAgencyRelayPoints(agencyId);
        
        // Appels parallèles
        const packagePromises = relays.map(r => relayPointService.getPackagesByRelayPoint(r.id));
        const results = await Promise.all(packagePromises);
        
        // Aplatir les résultats
        return results.flat();
    } catch (e) {
        console.error("Erreur aggrégation colis agence", e);
        return [];
    }
};

/**
 * Appelle la route de vérification de l'agence pour obtenir les détails
 * d'assignation de l'utilisateur connecté (Relay Point ID, statut, etc.).
 * Route : GET /api/agencies/{agencyId}/verification
 */
const getAgencyVerification = async (agencyId: string): Promise<any> => {
    console.log(`🔍 [AgencyService] Vérification contextuelle pour Agence: ${agencyId}`);
    try {
        const response = await apiClient<any>(`/api/agencies/${agencyId}/verification`, 'GET');
        console.log("✅ [AgencyService] Résultat Verification:", response);
        return response;
    } catch (error) {
        console.error("❌ Erreur lors de la vérification agence:", error);
        return null;
    }
};

/**
 * Crée une nouvelle agence.
 * Route : POST /api/agencies/management/create
 */
const createAgency = async (data: AgencyCreationPayload): Promise<Agency> => {
    console.group('🏢 [AgencyService] Create New Agency');
    console.log("📤 Payload envoyé:", data);

    try {
        const response = await apiClient<Agency>('/api/agencies/management/create', 'POST', data);
        console.log("✅ Agence créée avec succès:", response);
        console.groupEnd();
        return response;
    } catch (error: any) {
        console.error("❌ Erreur création agence:", error);
        console.groupEnd();
        throw error;
    }
};

/**
 * Met à jour une agence existante.
 * Route : PUT /api/agencies/management/{agencyId}
 */
const updateAgency = async (agencyId: string, data: Partial<AgencyCreationPayload>): Promise<Agency> => {
    console.log(`📝 [AgencyService] Update Agency ${agencyId}`);
    return apiClient<Agency>(`/api/agencies/management/${agencyId}`, 'PUT', data);
};

export const agencyService = {
  getAgencyByOwnerId,
  getAgencyRelayPoints,
  getRelayPointsByOwner, // Utile si on n'a pas encore l'ID agence chargé
  getAgencyEmployees,
  assignManagerToRelay,
  getAgencyVerification,
  assignEmployeeToAgency,
  verifyAgencyStatus,
  getAllAgencyPackages,
  createAgency,
  updateAgency,
  
  // Aliases pour compatibilité existante
  getMyAgency: getAgencyByOwnerId,
  addEmployeeToAgency: assignEmployeeToAgency
};