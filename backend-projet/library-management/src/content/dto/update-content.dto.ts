import { PartialType } from '@nestjs/mapped-types';
import { CreateContentDto } from './create-content.dto.js';

export class UpdateContentDto extends PartialType(CreateContentDto) {}
