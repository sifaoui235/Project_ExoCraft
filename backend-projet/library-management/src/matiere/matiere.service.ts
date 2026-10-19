import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateMatiereDto } from './dto/create-matiere.dto.js';
import { UpdateMatiereDto } from './dto/update-matiere.dto.js';
import { Matiere, MatiereDocument } from './entities/matiere.entity.js';
import { Persist } from '../db/persist.js';

@Injectable()
export class MatiereService {
  private matieres: Matiere[] = [];
  private nextId = 1;
  private nextDocId = 1;

  constructor() {
    Persist.register('matieres', () => this.matieres, (v: Matiere[]) => {
      this.matieres = v;
      this.nextId = v.length > 0 ? Math.max(...v.map(m => m.id)) + 1 : 1;
      const allDocs = v.flatMap(m => m.documents || []);
      this.nextDocId = allDocs.length > 0 ? Math.max(...allDocs.map(d => d.id)) + 1 : 1;
    });
  }

  create(createMatiereDto: CreateMatiereDto): Matiere {
    const existante = this.matieres.find(
      (m) => m.nom.toLowerCase() === createMatiereDto.nom.toLowerCase(),
    );
    if (existante) {
      throw new ConflictException(`La matière "${createMatiereDto.nom}" existe déjà`);
    }

    const newMatiere: Matiere = {
      id: this.nextId++,
      nom: createMatiereDto.nom,
      enseignantsCount: 0,
      promoIds: createMatiereDto.promoIds || [],
      documents: [],
      description: createMatiereDto.description,
    };

    this.matieres.push(newMatiere);
    return newMatiere;
  }

  findAll(): Matiere[] {
    return this.matieres;
  }

  findOne(id: number): Matiere {
    const matiere = this.matieres.find((m) => m.id === id);
    if (!matiere) {
      throw new NotFoundException(`Matière avec l'id ${id} introuvable`);
    }
    return matiere;
  }

  update(id: number, updateMatiereDto: UpdateMatiereDto): Matiere {
    const matiere = this.findOne(id);

    if (updateMatiereDto.nom) {
      const doublon = this.matieres.find(
        (m) =>
          m.nom.toLowerCase() === (updateMatiereDto.nom as string).toLowerCase() &&
          m.id !== id,
      );
      if (doublon) {
        throw new ConflictException(`La matière "${updateMatiereDto.nom}" existe déjà`);
      }
    }

    Object.assign(matiere, updateMatiereDto);
    return matiere;
  }

  remove(id: number): Matiere {
    const index = this.matieres.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new NotFoundException(`Matière avec l'id ${id} introuvable`);
    }
    const [removed] = this.matieres.splice(index, 1);
    return removed;
  }

  // ── Documents ─────────────────────────────────────────────────────────────
  addDocument(matiereId: number, doc: Omit<MatiereDocument, 'id' | 'uploadedAt'>): MatiereDocument {
    const matiere = this.findOne(matiereId);
    const newDoc: MatiereDocument = {
      ...doc,
      id: this.nextDocId++,
      uploadedAt: new Date().toISOString(),
    };
    matiere.documents.push(newDoc);
    return newDoc;
  }

  updateDocument(matiereId: number, docId: number, data: Partial<MatiereDocument>): MatiereDocument {
    const matiere = this.findOne(matiereId);
    const doc = matiere.documents.find((d) => d.id === docId);
    if (!doc) throw new NotFoundException(`Document ${docId} introuvable`);
    Object.assign(doc, data);
    return doc;
  }

  deleteDocument(matiereId: number, docId: number): void {
    const matiere = this.findOne(matiereId);
    const index = matiere.documents.findIndex((d) => d.id === docId);
    if (index === -1) throw new NotFoundException(`Document ${docId} introuvable`);
    matiere.documents.splice(index, 1);
  }
}
