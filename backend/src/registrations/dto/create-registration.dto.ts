import { IsInt } from 'class-validator';

export class CreateRegistrationDto {
  @IsInt({ message: 'userId deve ser um número inteiro' })
  userId!: number;

  @IsInt({ message: 'actionId deve ser um número inteiro' })
  actionId!: number;
}
