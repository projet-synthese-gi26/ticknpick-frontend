// FICHIER: src/services/apiClient.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pickndropback.onrender.com';

async function apiClient<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  body?: any,
  headers?: Record<string, string>
): Promise<T> {
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  let token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  if (token) token = token.replace(/^"(.*)"$/, '$1');

  // Code couleur pour différencier les rôles dans la console
  let logStyle = 'color: #3b82f6; font-weight: bold;'; // Blue (Standard)
  if (endpoint.includes('deliverer') || endpoint.includes('pickup-from') || endpoint.includes('deliver-to')) 
      logStyle = 'color: #7c3aed; font-weight: bold;'; // Violet (Livreur)
  if (endpoint.includes('relay-point') || endpoint.includes('relay-to')) 
      logStyle = 'color: #f97316; font-weight: bold;'; // Orange (Relais)

  console.groupCollapsed(`%c📡 [API REQUEST] ${method} ${endpoint}`, logStyle);
  console.log('URL:', url);
  if(body) console.log('Payload:', body);
  console.groupEnd();

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...headers,
    },
  };

  if (body) {
    if (body instanceof FormData) {
        const h = config.headers as Record<string, string>;
        delete h['Content-Type']; 
        config.body = body;
    } else {
        config.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(url, config);
    
    // Log de la réponse
    console.groupCollapsed(`%c📩 [API RESPONSE] ${response.status} ${endpoint}`, response.ok ? 'color: #10b981;' : 'color: #ef4444;');
    
    const clone = response.clone();
    let data;
    try {
        const text = await clone.text();
        data = text ? JSON.parse(text) : {};
        console.log('Body:', data);
    } catch(e) {
        console.warn('Empty or invalid JSON body');
    }
    console.groupEnd();

    if (response.ok) {
        return data as T;
    } else {
         const errorMessage = data?.message || data?.error || `Erreur HTTP ${response.status}`;
         throw new Error(errorMessage);
    }

  } catch (error: any) {
    console.error(`💥 Network Error ${method} ${endpoint}:`, error);
    throw error;
  }
}

export default apiClient;