import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateContentDto } from './dto/create-content.dto.js';
import { UpdateContentDto } from './dto/update-content.dto.js';
import { FilterContentDto } from './dto/filter-content.dto.js';
import { Content } from './entities/content.entity.js';

@Injectable()
export class ContentService {
  private contents: Content[] = [];
  private nextId = 1;

  // ─────────────────────────────────────────────────────
  // CRUD
  // ─────────────────────────────────────────────────────

  create(dto: CreateContentDto): Content {
    const newContent: Content = {
      id: this.nextId++,
      titre: dto.titre,
      type: dto.type,
      matiere: dto.matiere,
      theme: dto.theme,
      contenu: dto.contenu,
      statut: 'brouillon',
      visibilite: dto.visibilite ?? 'prive',
      auteurId: dto.auteurId,
      dateCreation: new Date(),
      dateModification: new Date(),
      archived: false,
    };
    this.contents.push(newContent);
    return newContent;
  }

  // Lister avec filtres + pagination
  findAll(filters: FilterContentDto): { data: Content[]; total: number; page: number; limit: number } {
    let result = [...this.contents];

    if (filters.type)       result = result.filter((c) => c.type === filters.type);
    if (filters.matiere)    result = result.filter((c) => c.matiere.toLowerCase().includes(filters.matiere!.toLowerCase()));
    if (filters.statut)     result = result.filter((c) => c.statut === filters.statut);
    if (filters.visibilite) result = result.filter((c) => c.visibilite === filters.visibilite);

    const total = result.length;
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 10;
    const start = (page - 1) * limit;

    return {
      data: result.slice(start, start + limit),
      total,
      page,
      limit,
    };
  }

  // Contenus publics (visibles par tous les enseignants)
  findPublic(filters: FilterContentDto): { data: Content[]; total: number; page: number; limit: number } {
    return this.findAll({ ...filters, visibilite: 'public', statut: 'valide' });
  }

  // Contenus d'un enseignant spécifique (hors archivés)
  findByAuteur(auteurId: number, filters: FilterContentDto): { data: Content[]; total: number; page: number; limit: number } {
    let result = this.contents.filter((c) => c.auteurId === auteurId && !c.archived);

    if (filters.type)       result = result.filter((c) => c.type === filters.type);
    if (filters.matiere)    result = result.filter((c) => c.matiere.toLowerCase().includes(filters.matiere!.toLowerCase()));
    if (filters.statut)     result = result.filter((c) => c.statut === filters.statut);
    if (filters.visibilite) result = result.filter((c) => c.visibilite === filters.visibilite);

    const total = result.length;
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 10;
    const start = (page - 1) * limit;

    return {
      data: result.slice(start, start + limit),
      total,
      page,
      limit,
    };
  }

  findOne(id: number): Content {
    const content = this.contents.find((c) => c.id === id);
    if (!content) {
      throw new NotFoundException(`Contenu avec l'id ${id} introuvable`);
    }
    return content;
  }

  update(id: number, auteurId: number, dto: UpdateContentDto): Content {
    const content = this.findOne(id);
    this.checkOwnership(content, auteurId);
    Object.assign(content, dto, { dateModification: new Date() });
    return content;
  }

  remove(id: number, auteurId: number): Content {
    const content = this.findOne(id);
    this.checkOwnership(content, auteurId);
    const index = this.contents.findIndex((c) => c.id === id);
    const [removed] = this.contents.splice(index, 1);
    return removed;
  }

  // ─────────────────────────────────────────────────────
  // VALIDER (brouillon → validé)
  // ─────────────────────────────────────────────────────

  valider(id: number, auteurId: number): Content {
    const content = this.findOne(id);
    this.checkOwnership(content, auteurId);
    if (!content.contenu || content.contenu.trim().length === 0) {
      throw new BadRequestException('Impossible de valider un contenu vide');
    }
    content.statut = 'valide';
    content.dateModification = new Date();
    return content;
  }

  // ─────────────────────────────────────────────────────
  // PUBLICATION (privé ↔ public)
  // ─────────────────────────────────────────────────────

  toggleVisibilite(id: number, auteurId: number): Content {
    const content = this.findOne(id);
    this.checkOwnership(content, auteurId);
    if (content.statut !== 'valide') {
      throw new BadRequestException('Seul un contenu validé peut être publié');
    }
    content.visibilite = content.visibilite === 'prive' ? 'public' : 'prive';
    content.dateModification = new Date();
    return content;
  }

  // ─────────────────────────────────────────────────────
  // DUPLIQUER (un enseignant copie un contenu public)
  // ─────────────────────────────────────────────────────

  dupliquer(id: number, nouvelAuteurId: number): Content {
    const original = this.findOne(id);
    if (original.visibilite !== 'public') {
      throw new ForbiddenException('Seul un contenu public peut être dupliqué');
    }
    const copie: Content = {
      ...original,
      id: this.nextId++,
      auteurId: nouvelAuteurId,
      statut: 'brouillon',
      visibilite: 'prive',
      dateCreation: new Date(),
      dateModification: new Date(),
      titre: `[Copie] ${original.titre}`,
    };
    this.contents.push(copie);
    return copie;
  }

  // ─────────────────────────────────────────────────────
  // ARCHIVAGE
  // ─────────────────────────────────────────────────────

  archiver(id: number, auteurId: number): Content {
    const content = this.findOne(id);
    this.checkOwnership(content, auteurId);
    content.archived = true;
    content.archivedAt = new Date();
    content.dateModification = new Date();
    return content;
  }

  desarchiver(id: number, auteurId: number): Content {
    const content = this.findOne(id);
    this.checkOwnership(content, auteurId);
    content.archived = false;
    content.archivedAt = undefined;
    content.dateModification = new Date();
    return content;
  }

  findArchived(auteurId: number, filters: FilterContentDto): { data: Content[]; total: number; page: number; limit: number } {
    let result = this.contents.filter((c) => c.auteurId === auteurId && c.archived);

    if (filters.type)    result = result.filter((c) => c.type === filters.type);
    if (filters.matiere) result = result.filter((c) => c.matiere.toLowerCase().includes(filters.matiere!.toLowerCase()));

    const total = result.length;
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 10;
    const start = (page - 1) * limit;

    return { data: result.slice(start, start + limit), total, page, limit };
  }

  // ─────────────────────────────────────────────────────
  // VÉRIFICATION PROPRIÉTÉ
  // ─────────────────────────────────────────────────────

  private checkOwnership(content: Content, auteurId: number): void {
    if (content.auteurId !== auteurId) {
      throw new ForbiddenException(
        'Vous n\'êtes pas autorisé à modifier ce contenu',
      );
    }
  }
}
