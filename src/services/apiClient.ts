// FICHIER: src/services/apiClient.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://TiiBnTickback.onrender.com';

async function apiClient<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  headers?: Record<string, string>
): Promise<T> {
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Récupération et nettoyage du token
  let token = localStorage.getItem('authToken');
  if (token) {
    // Enlève les guillemets si présents
    token = token.replace(/^"(.*)"$/, '$1');
  }

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
        // Le navigateur gère le Content-Type et boundary pour FormData
        const h = config.headers as Record<string, string>;
        delete h['Content-Type']; 
        config.body = body;
    } else {
        config.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(url, config);

    // GESTION DES ERREURS
    if (!response.ok) {
      // Cas spécial : Si c'est une tentative de Login (401), ce n'est pas une "Session Expirée"
      if (endpoint.includes('/auth/login') && response.status === 401) {
         throw new Error("Email ou mot de passe incorrect.");
      }

      // Cas standard : 401 sur une autre route = Token invalide/expiré
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
             localStorage.removeItem('authToken');
             localStorage.removeItem('user');
             // On peut forcer une redirection ici si nécessaire, mais attention aux boucles
             // window.location.href = '/login';
        }
        throw new Error("Session expirée, veuillez vous reconnecter.");
      }

      // Tenter de lire le message d'erreur du backend
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // Si ce n'est pas du JSON
      }
      
      const message = errorData?.message || errorData?.error || `Erreur serveur (${response.status})`;
      throw new Error(message);
    }

    // Traitement de la réponse (JSON ou vide)
    const responseText = await response.text();
    if (!responseText) return {} as T;

    try {
        return JSON.parse(responseText) as T;
    } catch (e) {
        // Si la réponse n'est pas du JSON mais que le statut est OK
        return responseText as unknown as T;
    }

  } catch (error: any) {
    console.error(`[API Client] Erreur sur ${method} ${endpoint}:`, error.message);
    throw error;
  }
}

export default apiClient;