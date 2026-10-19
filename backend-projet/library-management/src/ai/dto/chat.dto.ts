import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @IsEnum(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class ChatDto {
  @IsString()
  @IsNotEmpty({ message: 'Le message est obligatoire' })
  message: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  @IsOptional()
  historique?: ChatMessageDto[];
}
