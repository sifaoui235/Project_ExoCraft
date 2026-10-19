import { PartialType } from '@nestjs/mapped-types';
import { CreateMatiereDto } from './create-matiere.dto.js';

export class UpdateMatiereDto extends PartialType(CreateMatiereDto) {}
