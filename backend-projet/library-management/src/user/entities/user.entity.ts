export class User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  motDePasseHash: string;
  role: string;
  actif?: boolean;
  avatar?: string | null;
  bio?: string;
  // associations classes/sections envoyées par le frontend de Rami
  associations: Array<{ className: string; section: string }>;
}
