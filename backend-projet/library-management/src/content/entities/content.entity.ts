export class Content {
  id: number;
  titre: string;
  type: string;
  matiere: string;
  theme: string;
  contenu: string;
  statut: string;
  visibilite: string;
  auteurId: number;
  dateCreation: Date;
  dateModification: Date;
  // Archivage
  archived: boolean;
  archivedAt?: Date;
}
