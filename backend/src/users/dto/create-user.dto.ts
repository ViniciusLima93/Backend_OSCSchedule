import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export const ROLES = ['Morador', 'Organizador'] as const;
export type Role = (typeof ROLES)[number];

export class CreateUserDto {
  @IsString()
  @MinLength(1, { message: 'Nome é obrigatório' })
  name!: string;

  @IsEmail({}, { message: 'E-mail inválido' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  password!: string;

  @IsIn(ROLES, { message: 'Função inválida (use Morador ou Organizador)' })
  role!: Role;
}
