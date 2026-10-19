import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreatePromotionDto } from './dto/create-promotion.dto.js';
import { UpdatePromotionDto } from './dto/update-promotion.dto.js';
import { Promotion } from './entities/promotion.entity.js';

@Injectable()
export class PromotionService {
  private promotions: Promotion[] = [];
  private nextId = 1;

  create(dto: CreatePromotionDto): Promotion {
    const existante = this.promotions.find(
      (p) => p.nom.toLowerCase() === dto.nom.toLowerCase(),
    );
    if (existante) {
      throw new ConflictException(`La promotion "${dto.nom}" existe déjà`);
    }
    const newPromotion: Promotion = {
      id: this.nextId++,
      nom: dto.nom,
      description: dto.description,
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
    if (dto.nom) {
      const doublon = this.promotions.find(
        (p) => p.nom.toLowerCase() === dto.nom!.toLowerCase() && p.id !== id,
      );
      if (doublon) {
        throw new ConflictException(`La promotion "${dto.nom}" existe déjà`);
      }
    }
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
