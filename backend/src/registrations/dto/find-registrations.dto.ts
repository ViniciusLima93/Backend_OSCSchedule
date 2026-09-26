import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional } from 'class-validator';

export const REGISTRATION_STATUS = ['confirmada', 'cancelada'] as const;

// Filtros opcionais da listagem (query string)
export class FindRegistrationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  actionId?: number;

  @IsOptional()
  @IsIn(REGISTRATION_STATUS, { message: 'Status inválido' })
  status?: (typeof REGISTRATION_STATUS)[number];
}
