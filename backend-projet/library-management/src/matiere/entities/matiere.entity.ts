export class Matiere {
  id: number;
  nom: string;
  enseignantsCount: number;
  promoIds: number[];
  documents: MatiereDocument[];
  description?: string;
}

export class MatiereDocument {
  id: number;
  titre: string;
  type: string;    // 'cours' | 'examen' | 'exercice' | 'resume'
  format: string;  // 'PDF' | 'Word'
  fileName: string;
  size: string;
  uploadedAt: string;
  promo: string;
  filePath?: string;
}
