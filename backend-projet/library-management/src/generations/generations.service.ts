import { Injectable } from '@nestjs/common';

export interface Generation {
  id: number;
  userId: number;
  type: string;
  matiere: string;
  createdAt: Date;
  status: string;
}

@Injectable()
export class GenerationsService {
  private generations: Generation[] = [];

  findAll(page = 1, limit = 20): {
    data: Generation[];
    total: number;
    page: number;
    limit: number;
  } {
    const total = this.generations.length;
    const start = (page - 1) * limit;
    return {
      data: this.generations.slice(start, start + limit),
      total,
      page,
      limit,
    };
  }

  getStats() {
    const total = this.generations.length;
    const byType: Record<string, number> = {};
    const now = new Date();
    let thisMonth = 0;

    for (const g of this.generations) {
      byType[g.type] = (byType[g.type] || 0) + 1;
      const d = new Date(g.createdAt);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        thisMonth++;
      }
    }

    return { total, byType, thisMonth };
  }

  // Appelé par AiService lors d'une génération réussie
  record(userId: number, type: string, matiere: string, status = 'success'): Generation {
    const g: Generation = {
      id: this.generations.length + 1,
      userId,
      type,
      matiere,
      createdAt: new Date(),
      status,
    };
    this.generations.push(g);
    return g;
  }
}
