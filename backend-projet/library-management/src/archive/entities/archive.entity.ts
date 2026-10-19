export class Archive {
  id: number;
  nom: string;            // nom original du fichier
  type: 'pdf' | 'word';
  matiere: string;
  promotion: string;
  cheminFichier: string;  // chemin sur le serveur
  texteExtrait: string;   // contenu extrait pour la génération IA
  taille: number;         // taille en octets
  dateDepot: Date;
}
