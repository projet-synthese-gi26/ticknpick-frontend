// FICHIER: src/services/employeeService.ts
import apiClient from './apiClient';

export type EmployeeRole = 'AGENCY_MANAGER' | 'RELAY_MANAGER' | 'DELIVERER' | 'GENERAL';

export interface Employee {
    id: string;
    userId: string;
    agencyId: string;
    relayPointId?: string; // Important pour la détection
    role: EmployeeRole | EmployeeRole[]; // Parfois un tableau selon le backend
    position?: string;
    name?: string;
    email?: string;
    phone?: string;
    photoUrl?: string;
    status?: string;
    createdAt?: string;
}

const getAgencyEmployees = async (agencyId: string): Promise<Employee[]> => {
    return apiClient<Employee[]>(`/api/v1/employees/agency/${agencyId}`, 'GET');
};

const getRelayEmployees = async (relayPointId: string): Promise<Employee[]> => {
    return apiClient<Employee[]>(`/api/v1/employees/relay-point/${relayPointId}`, 'GET');
};

const assignToRelayPoint = async (employeeId: string, relayPointId: string): Promise<any> => {
    console.log(`🔗 [EmployeeService] Assignation Emp ${employeeId} -> Relay ${relayPointId}`);
    // PATCH /api/v1/employees/{id}/assign-relay-point?relayPointId={uuid}
    return apiClient<any>(`/api/v1/employees/${employeeId}/assign-relay-point?relayPointId=${relayPointId}`, 'PATCH');
};

const changeRole = async (employeeId: string, newRole: EmployeeRole): Promise<any> => {
    console.log(`👑 [EmployeeService] Changement rôle Emp ${employeeId} -> ${newRole}`);
    // PATCH /api/v1/employees/{id}/change-role?newRole={ROLE}
    return apiClient<any>(`/api/v1/employees/${employeeId}/change-role?newRole=${newRole}`, 'PATCH');
};

const removeFromRelayPoint = async (employeeId: string): Promise<any> => {
    // PATCH /api/v1/employees/{employeeId}/remove-relay-point
    return apiClient<any>(`/api/v1/employees/${employeeId}/remove-relay-point`, 'PATCH');
};

// Endpoint utilitaire pour trouver l'enregistrement employé via le userId (nécessaire pour le login)
const getEmployeeByUserId = async (userId: string): Promise<Employee | null> => {
    try {
        // Comme il n'y a pas d'endpoint direct getByUserId, on récupère via l'endpoint générique
        // Note: Cela suppose que vous avez accès à une liste ou un moyen de filtrer.
        // Solution de contournement robuste: Fetch /api/employees et filtrer (attention aux perfs à terme)
        // IDEALEMENT: Le backend devrait fournir /api/v1/employees/me ou /by-user/{userId}
        const all = await apiClient<Employee[]>('/api/employees', 'GET');
        const found = all.find((e: any) => e.userId === userId || e.user_id === userId);
        return found || null;
    } catch (e) {
        console.warn("Impossible de récupérer les détails employés pour cet utilisateur", e);
        return null;
    }
};

export const employeeService = {
    getAgencyEmployees,
    getRelayEmployees,
    assignToRelayPoint,
    changeRole,
    removeFromRelayPoint,
    getEmployeeByUserId // Ajout
};