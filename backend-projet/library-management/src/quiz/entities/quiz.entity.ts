import { Question } from './question.entity.js';

export class Quiz {
  id: number;
  titre: string;
  theme: string;
  matiere: string;
  niveau: 'debutant' | 'intermediaire' | 'avance';
  statut: 'brouillon' | 'valide';
  visibilite: 'prive' | 'public';
  dateGeneration: Date;
  questions: Question[];
  contenuIA?: string;
  auteurId?: number;
  typeIA?: 'quiz' | 'serie' | 'examen';
  // Archivage
  archived: boolean;
  archivedAt?: Date;
}
