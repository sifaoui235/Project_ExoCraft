export class Promotion {
  id: number;
  nom: string;
  code: string;
  niveau: string;       // '1ere' | '2eme' | '3eme' | '4eme' | '5eme'
  type: string;         // 'prepa' | 'branche_commune' | 'specialite' | 'general'
  specialite?: string | null;
  semestre: string;     // 'S1' | 'S2' | 'S1-S2'
  matieres: string[];   // noms des matières associées
  etablissementType: string;
  description?: string;
}
