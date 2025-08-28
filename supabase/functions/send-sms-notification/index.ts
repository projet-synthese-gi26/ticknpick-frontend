import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// Les informations de l'API Orange (à stocker en tant que secrets Supabase)
// Pour les définir : supabase secrets set ORANGE_AUTH_TOKEN="votre_token_ici"
const ORANGE_API_URL = 'https://api.orange.com/smsmessaging/v1/outbound/smspreview'; // URL exemple
const ORANGE_AUTH_TOKEN = Deno.env.get('ORANGE_AUTH_TOKEN')!;

serve(async (req) => {
  // 1. Gérer les requêtes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    } });
  }

  try {
    // 2. Extraire les données de la requête
    const { to, message } = await req.json();

    if (!to || !message) {
      throw new Error('Le numéro de destination ("to") et le message sont requis.');
    }
    
    const senderPhoneNumber = '691743511';
    
    // 3. Préparer et envoyer la requête à l'API d'Orange
    const response = await fetch(`${ORANGE_API_URL}/tel:+237${senderPhoneNumber}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ORANGE_AUTH_TOKEN}`
      },
      body: JSON.stringify({
        outboundSMSMessageRequest: {
          address: `tel:+237${to}`,
          senderAddress: `tel:+237${senderPhoneNumber}`,
          outboundSMSTextMessage: {
            message: message
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur API Orange: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    console.log("SMS envoyé via Orange :", data);

    // 4. Retourner une réponse de succès
    return new Response(JSON.stringify({ success: true, details: data }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // IMPORTANT pour CORS
      },
    });

  } catch (error) {
    console.error("Erreur dans la fonction send-sms-notification:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
});