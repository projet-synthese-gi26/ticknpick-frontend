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

  // Logs en VIOLET si le mot clé "deliverer" est dans l'URL pour différencier les flux visuellement
  const isLivreur = endpoint.includes('deliverer');
  const groupStyle = isLivreur 
    ? 'color: #8b5cf6; font-weight: bold; background: #f3f0ff; padding: 2px 5px; border-radius: 4px;' 
    : 'color: #3b82f6; font-weight: bold;';

  console.groupCollapsed(`%c🌐 [API] ${method} ${endpoint}`, groupStyle);

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
    const clone = response.clone();
    
    if (response.ok) {
        try {
            // Tente de parser, si vide retourne null sans erreur
            const text = await clone.text();
            const data = text ? JSON.parse(text) : {};
            console.log('✅ Success Payload:', data);
            console.groupEnd();
            return data as T;
        } catch(e) {
            console.warn('⚠️ JSON Parse Warning (Success but malformed JSON)');
            console.groupEnd();
            return {} as T;
        }
    } else {
         // --- CORRECTION DE L'ERREUR CONSOLE ---
         const errorText = await clone.text();
         console.warn(`❌ [API FAIL] Status: ${response.status}`);
         if (errorText) console.error('Error Body:', errorText);
         else console.log('Error Body is empty.');
         
         console.groupEnd();

         // Tentative d'extraire un message propre
         let errorMessage = `Erreur HTTP ${response.status}`;
         try {
             const jsonError = JSON.parse(errorText);
             errorMessage = jsonError.message || jsonError.error || errorMessage;
         } catch(e) {
             if (errorText) errorMessage = errorText.substring(0, 100);
         }
         
         throw new Error(errorMessage);
    }

  } catch (error: any) {
    console.error(`💥 Network Error ${method} ${endpoint}:`, error);
    console.groupEnd();
    throw error;
  }
}

export default apiClient;