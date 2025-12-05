import apiClient from './apiClient';

// Créons des types basés sur votre backend. Idéalement, mettez-les dans src/types/api.ts
interface Shipment {
    id: number;
    tracking_number: string;
    // ... toutes les autres propriétés du colis
    status: string; 
    departurePoint?: { name: string };
    arrivalPoint?: { name: string };
    sender_name: string;
    sender_phone: string;
    recipient_name: string;
    recipient_phone: string;
    description: string;
    weight: number;
    is_fragile: boolean;
    is_perishable: boolean;
    is_insured: boolean;
    declared_value: number;
    is_paid_at_departure: boolean;
    shipping_cost: number;
}

// Point d'Attention ! Voir note ci-dessous.
// On suppose que votre API a un endpoint comme celui-ci
const getShipmentByTrackingNumber = async (trackingNumber: string): Promise<Shipment> => {
    // Cet endpoint N'EXISTE PAS dans votre OpenAPI. Il est crucial.
    // Vous devriez ajouter : GET /shipments/track/{trackingNumber}
    return apiClient<Shipment>(`/shipments/track/${trackingNumber}`);
};

const updateShipmentStatus = async (shipmentId: number, status: string): Promise<Shipment> => {
    // Cet endpoint N'EXISTE PAS dans votre OpenAPI. 
    // Basé sur votre spec, il faudrait peut-être un PUT sur une entité existante.
    // Suggestion : PUT /shipments/{id}/status
    return apiClient<Shipment>(`/shipments/${shipmentId}/status`, 'PUT', { status });
};

const logWithdrawal = async (logData: any): Promise<any> => {
    // Cet endpoint N'EXISTE PAS. 
    // Suggestion: POST /withdrawal-logs
    return apiClient<any>('/withdrawal-logs', 'POST', logData);
};


export const shipmentService = {
  getShipmentByTrackingNumber,
  updateShipmentStatus,
  logWithdrawal
};