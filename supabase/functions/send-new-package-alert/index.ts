// supabase/functions/send-new-package-alert/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Récupérer le token secret stocké via la CLI Supabase
const ORANGE_AUTH_TOKEN = Deno.env.get('ORANGE_AUTH_TOKEN');
const SENDER_PHONE_NUMBER = '691234567'; // Votre numéro d'envoi autorisé par Orange
const APP_LINK = "https://votre-app.com/courses"; // Mettez le lien vers votre application ici

serve(async (req) => {
  // Gérer la requête CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    if (!ORANGE_AUTH_TOKEN) {
      throw new Error("Secret ORANGE_AUTH_TOKEN manquant.");
    }

    const {
      livreur_phone,
      livreur_name,
      tracking_number,
      sender_name,
      recipient_name
    } = await req.json();
    
    if (!livreur_phone || !tracking_number) {
      throw new Error("Données manquantes : téléphone du livreur et numéro de suivi requis.");
    }

    // Construction du message SMS
    const message = `Bonjour ${livreur_name || 'livreur'}, un nouveau colis (${tracking_number}) de ${sender_name} pour ${recipient_name} attend d'être livré. Connectez-vous pour accepter la course : ${APP_LINK}`;

    // Normaliser le numéro de téléphone pour l'API Orange (format +2376XXXXXXXX)
    const normalizedPhone = `+237${livreur_phone.replace(/^(\+237|237)/, '').trim()}`;
    
    // Appel à l'API SMS Orange
    const response = await fetch(`https://api.orange.com/smsmessaging/v1/outbound/tel:+237${SENDER_PHONE_NUMBER}/requests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ORANGE_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outboundSMSMessageRequest: {
          address: `tel:${normalizedPhone}`,
          senderAddress: `tel:+237${SENDER_PHONE_NUMBER}`,
          outboundSMSTextMessage: {
            message: message,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur API Orange: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();

    return new Response(JSON.stringify({ success: true, details: responseData }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    });

  } catch (error) {
    console.error('Erreur dans la Edge Function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500,
    });
  }
});