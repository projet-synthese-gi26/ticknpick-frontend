// Pour plus de clarté, unifions les cas (majuscules)
type AccountType = 'CLIENT' | 'LIVREUR' | 'FREELANCE' | 'AGENCY';

// Le profil de base, qui peut être n'importe quel type
export interface UserProfile {
  id: string;
  account_type: AccountType; // Utilise notre type unifié
  manager_name: string | null;
  email?: string | null;
  name: string; // Ajouté pour la cohérence
  role: string; // Ajouté pour la cohérence
  [key: string]: any;
}

// Le profil PRO, qui est un UserProfile mais avec un type de compte RESTREINT
export interface ProProfile extends UserProfile {
  account_type: 'FREELANCE' | 'AGENCY'; // On spécifie ici que c'est forcément l'un de ces deux
  business_name?: string;
  business_type?: string;
}