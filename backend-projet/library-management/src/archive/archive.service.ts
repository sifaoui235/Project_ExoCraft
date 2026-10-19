import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import * as mammoth from 'mammoth';
import { Archive } from './entities/archive.entity.js';
import { CreateArchiveDto } from './dto/create-archive.dto.js';
import { Persist } from '../db/persist.js';

@Injectable()
export class ArchiveService {
  private archives: Archive[] = [];
  private nextId = 1;
  private readonly uploadDir = join(process.cwd(), 'uploads', 'archives');

  constructor() {
    // Créer le dossier d'upload s'il n'existe pas
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
    Persist.register('archives', () => this.archives, (v: Archive[]) => {
      this.archives = v;
      this.nextId = v.length > 0 ? Math.max(...v.map(a => a.id)) + 1 : 1;
    });
  }

  // ─────────────────────────────────────────────────────
  // UPLOAD + EXTRACTION
  // ─────────────────────────────────────────────────────

  async upload(
    file: Express.Multer.File,
    dto: CreateArchiveDto,
  ): Promise<Archive> {
    const extension = file.originalname.split('.').pop()?.toLowerCase();

    if (!['pdf', 'doc', 'docx'].includes(extension ?? '')) {
      throw new BadRequestException(
        'Seuls les fichiers PDF et Word (.doc, .docx) sont acceptés',
      );
    }

    const typeArchive: 'pdf' | 'word' = extension === 'pdf' ? 'pdf' : 'word';

    // Extraction du texte
    let texteExtrait = '';
    try {
      texteExtrait = await this.extraireTexte(file.buffer, typeArchive);
    } catch {
      texteExtrait = '';
      // On ne bloque pas l'upload si l'extraction échoue
    }

    const newArchive: Archive = {
      id: this.nextId++,
      nom: file.originalname,
      type: typeArchive,
      matiere: dto.matiere,
      promotion: dto.promotion,
      cheminFichier: file.path ?? '',
      texteExtrait,
      taille: file.size,
      dateDepot: new Date(),
    };

    this.archives.push(newArchive);
    return newArchive;
  }

  // ─────────────────────────────────────────────────────
  // EXTRACTION DE TEXTE
  // ─────────────────────────────────────────────────────

  private async extraireTexte(
    buffer: Buffer,
    type: 'pdf' | 'word',
  ): Promise<string> {
    if (type === 'pdf') {
      // pdf-parse n'est pas compatible ESM natif, on passe par require
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
      const data = await pdfParse(buffer);
      return data.text?.trim() ?? '';
    } else {
      const result = await mammoth.extractRawText({ buffer });
      return result.value?.trim() ?? '';
    }
  }

  // ─────────────────────────────────────────────────────
  // CONSULTATION
  // ─────────────────────────────────────────────────────

  findAll(matiere?: string, promotion?: string, page = 1, limit = 10): {
    data: Archive[];
    total: number;
    page: number;
    limit: number;
  } {
    let result = [...this.archives];
    if (matiere)   result = result.filter((a) => a.matiere.toLowerCase().includes(matiere.toLowerCase()));
    if (promotion) result = result.filter((a) => a.promotion.toLowerCase().includes(promotion.toLowerCase()));

    const total = result.length;
    const start = (page - 1) * limit;
    return { data: result.slice(start, start + limit), total, page, limit };
  }

  // Filtrage selon les matières et promos de l'enseignant
  findForEnseignant(matieres: string[], promotions: string[]): Archive[] {
    return this.archives.filter(
      (a) =>
        matieres.some((m) => a.matiere.toLowerCase().includes(m.toLowerCase())) ||
        promotions.some((p) => a.promotion.toLowerCase().includes(p.toLowerCase())),
    );
  }

  findOne(id: number): Archive {
    const archive = this.archives.find((a) => a.id === id);
    if (!archive) {
      throw new NotFoundException(`Archive avec l'id ${id} introuvable`);
    }
    return archive;
  }

  // Récupérer le texte extrait pour la génération IA
  getTexte(id: number): { texte: string; nom: string; matiere: string } {
    const archive = this.findOne(id);
    if (!archive.texteExtrait || archive.texteExtrait.trim() === '') {
      throw new BadRequestException(
        `Impossible d'extraire le texte de l'archive "${archive.nom}". Le fichier est peut-être vide ou corrompu.`,
      );
    }
    return {
      texte: archive.texteExtrait,
      nom: archive.nom,
      matiere: archive.matiere,
    };
  }

  remove(id: number): Archive {
    const index = this.archives.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new NotFoundException(`Archive avec l'id ${id} introuvable`);
    }
    const [removed] = this.archives.splice(index, 1);

    // Supprimer le fichier physique si présent
    if (removed.cheminFichier && existsSync(removed.cheminFichier)) {
      try { unlinkSync(removed.cheminFichier); } catch { /* ignore */ }
    }

    return removed;
  }
}
