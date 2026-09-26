import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateActionDto } from './create-action.dto';

// O organizador de uma ação não pode ser trocado
export class UpdateActionDto extends PartialType(
  OmitType(CreateActionDto, ['organizerId'] as const),
) {}
