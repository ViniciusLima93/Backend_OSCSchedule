import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateActionDto {
  @IsInt({ message: 'organizerId deve ser um número inteiro' })
  organizerId!: number;

  @IsString()
  @MinLength(1, { message: 'Título é obrigatório' })
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  location!: string;

  @IsDateString({}, { message: 'eventDate deve ser uma data ISO 8601' })
  eventDate!: string;

  @IsInt({ message: 'Deve ser um número inteiro' })
  @Min(1, { message: 'Deve ser um número maior ou igual a 1' })
  vacancies!: number;

  @IsOptional()
  @IsArray({ message: 'Documentos inválidos!' })
  @IsString({ each: true, message: 'Cada documento deve ser um texto' })
  docs?: string[];
}
