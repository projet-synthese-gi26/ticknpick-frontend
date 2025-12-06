// FICHIER: src/services/walletService.ts

// URL de base de l'API Wallet externe
const WALLET_API_BASE_URL = "https://wallet-money.onrender.com";

// Interface pour les réponses API
export interface WalletTransactionResponse {
  message: string;
  transaction_id?: string;
  new_balance?: number; // L'API pourrait renvoyer le nouveau solde, sinon on le calcule
  status: string;
  success?: boolean;
}

interface WalletPayload {
  user_id: string;
  montant: number;
  description: string;
}

// --- MÉTHODES DU SERVICE ---

/**
 * Créditer un wallet (Dépôt d'argent/Recharge)
 * Correspond au cas : Le Business Actor met de l'argent sur son compte via Mobile Money
 */
const creditWallet = async (userId: string, amount: number, description: string): Promise<WalletTransactionResponse> => {
  const endpoint = `${WALLET_API_BASE_URL}/api/increment/`;
  
  // Payload strict selon la doc
  const payload: WalletPayload = {
    user_id: userId,
    montant: Number(amount),
    description: description || `Recharge via Portail`
  };

  console.log(`💸 [WALLET] Crediting ${amount} for user ${userId}`);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erreur API Wallet (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    return {
        ...data,
        status: 'SUCCESS', 
        success: true
    };

  } catch (error: any) {
    console.error("❌ Wallet Service Credit Error:", error);
    throw error;
  }
};

/**
 * Débiter un wallet (Paiement de commission / Retrait)
 * Correspond au cas : Paiement de commission à PicknDrop ou retrait de fonds
 */
const debitWallet = async (userId: string, amount: number, description: string): Promise<WalletTransactionResponse> => {
    const endpoint = `${WALLET_API_BASE_URL}/api/decrement/`;
    
    const payload: WalletPayload = {
      user_id: userId,
      montant: Number(amount),
      description
    };
  
    console.log(`💸 [WALLET] Debiting ${amount} from user ${userId}`);
  
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  
      if (!res.ok) throw new Error(`Debit Failed: ${res.statusText}`);
      
      const data = await res.json();
      return { ...data, status: 'SUCCESS', success: true };

    } catch (error) {
      console.error("❌ Debit Error:", error);
      throw error;
    }
  };

/**
 * Simulation de récupération d'historique.
 * Comme l'API externe n'a pas d'endpoint 'GET History' documenté, on gère ça localement ou via backend PicknDrop.
 */
const getTransactions = async (userId: string) => {
    // Simulation ou appel à ton backend PicknDrop s'il stocke les logs de transaction
    return []; 
};

export const walletService = {
  creditWallet,
  debitWallet,
  getTransactions
};