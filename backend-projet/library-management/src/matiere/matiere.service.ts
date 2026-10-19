import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateMatiereDto } from './dto/create-matiere.dto.js';
import { UpdateMatiereDto } from './dto/update-matiere.dto.js';
import { Matiere } from './entities/matiere.entity.js';

@Injectable()
export class MatiereService {
  private matieres: Matiere[] = [];
  private nextId = 1;

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

    // Vérifier doublon de nom si le nom est modifié
    if (updateMatiereDto.nom) {
      const doublon = this.matieres.find(
        (m) =>
          m.nom.toLowerCase() === updateMatiereDto.nom!.toLowerCase() &&
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
}
