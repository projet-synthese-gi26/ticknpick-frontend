import { supabase } from '@/lib/supabase';
import type { PackageInfo } from '../app/withdraw-package/page'; // Assurez-vous que le chemin est correct

/**
 * Normalise un numéro de téléphone pour l'envoi de SMS (format 6XXXXXXXX).
 * @param phone Le numéro à normaliser
 */
function normalizePhoneNumber(phone: string): string | null {
  if (!phone) return null;
  // Enlève les espaces, préfixes +237, 237, 00237 etc.
  const cleaned = phone.replace(/[\s+]/g, '');
  const match = cleaned.match(/^(237)?(6[235-9]\d{7})$/);
  return match ? match[2] : null;
}

/**
 * Déclenche l'envoi d'un SMS via la Edge Function Supabase.
 * @param to Le numéro du destinataire (sera normalisé)
 * @param message Le contenu du SMS
 */
async function sendSms(to: string, message: string) {
  const normalizedPhone = normalizePhoneNumber(to);
  if (!normalizedPhone) {
    console.warn(`Numéro de téléphone invalide ou non-camerounais, SMS non envoyé à: ${to}`);
    return;
  }
  
  try {
    const { data, error } = await supabase.functions.invoke('send-sms-notification', {
      body: { to: normalizedPhone, message },
    });
    if (error) throw error;
    console.log('Réponse de la fonction SMS :', data);
  } catch (error) {
    console.error(`Erreur lors de l'envoi du SMS à ${normalizedPhone}:`, error);
  }
}

// =========================================================
// == Fonctions standardisées pour les notifications SMS ===
// =========================================================

export async function notifyOnPackageDeposit(packageInfo: {
  trackingNumber: string,
  recipientName: string,
  recipientPhone: string,
  senderName: string,
  senderPhone: string,
  arrivalPointName: string
}) {
  // Message pour le destinataire
  const recipientMessage = `Bonjour ${packageInfo.recipientName}. Un colis (N°: ${packageInfo.trackingNumber}) vous a été envoyé par ${packageInfo.senderName}. Il arrivera bientôt au point relais ${packageInfo.arrivalPointName}. - Pick & Drop`;
  await sendSms(packageInfo.recipientPhone, recipientMessage);

  // Message de confirmation pour l'expéditeur
  const senderMessage = `Votre colis (N°: ${packageInfo.trackingNumber}) pour ${packageInfo.recipientName} a bien été déposé et est en cours d'acheminement. - Pick & Drop`;
  await sendSms(packageInfo.senderPhone, senderMessage);
}


export async function notifyOnPackageWithdrawal(packageInfo: PackageInfo, retirantName: string) {
  // Message de confirmation pour le retirant (on suppose que c'est le destinataire initial)
  const recipientMessage = `Bonjour ${retirantName}. Vous avez bien retiré le colis N°: ${packageInfo.trackingNumber} au point relais ${packageInfo.arrivalPointName}. Merci de votre confiance ! - Pick & Drop`;
  await sendSms(packageInfo.recipientPhone, recipientMessage);

  // Message de notification pour l'expéditeur
  const senderMessage = `Votre colis (N°: ${packageInfo.trackingNumber}) envoyé à ${packageInfo.recipientName} a été retiré avec succès par ${retirantName}. - Pick & Drop`;
  await sendSms(packageInfo.senderPhone, senderMessage);
}