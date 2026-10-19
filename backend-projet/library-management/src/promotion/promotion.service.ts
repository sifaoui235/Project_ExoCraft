import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreatePromotionDto } from './dto/create-promotion.dto.js';
import { UpdatePromotionDto } from './dto/update-promotion.dto.js';
import { Promotion } from './entities/promotion.entity.js';
import { Persist } from '../db/persist.js';

@Injectable()
export class PromotionService {
  private promotions: Promotion[] = [];
  private nextId = 1;

  constructor() {
    Persist.register('promotions', () => this.promotions, (v: Promotion[]) => {
      this.promotions = v;
      this.nextId = v.length > 0 ? Math.max(...v.map(p => p.id)) + 1 : 1;
    });
  }

  create(dto: CreatePromotionDto): Promotion {
    const newPromotion: Promotion = {
      id:                this.nextId++,
      nom:               dto.nom,
      code:              dto.code              ?? '',
      niveau:            dto.niveau            ?? '4eme',
      type:              dto.type              ?? 'general',
      specialite:        dto.specialite        ?? null,
      semestre:          dto.semestre          ?? 'S1',
      matieres:          [],
      etablissementType: dto.etablissementType ?? 'cycle_ing',
      description:       dto.description       ?? '',
    };
    this.promotions.push(newPromotion);
    return newPromotion;
  }

  findAll(): Promotion[] {
    return this.promotions;
  }

  findOne(id: number): Promotion {
    const promotion = this.promotions.find((p) => p.id === id);
    if (!promotion) {
      throw new NotFoundException(`Promotion avec l'id ${id} introuvable`);
    }
    return promotion;
  }

  update(id: number, dto: UpdatePromotionDto): Promotion {
    const promotion = this.findOne(id);
    Object.assign(promotion, dto);
    return promotion;
  }

  remove(id: number): Promotion {
    const index = this.promotions.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`Promotion avec l'id ${id} introuvable`);
    }
    const [removed] = this.promotions.splice(index, 1);
    return removed;
  }
}
