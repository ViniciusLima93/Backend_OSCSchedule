import { IsEmail, IsIn, MinLength } from "@nestjs/class-validator";



const ROLES = ['Morador', 'Organizador'] as const;



export class CreateUserDto {

    @MinLength(1,{message:'Nome é obrigatório'})
    name!: string;

    @IsEmail()
    email!:string;

    @MinLength(8, {message:'A senha deve ter pelo menos 8 caracteres'})
    password!: string;

    
    @IsIn(ROLES, {message: 'Função Inválida'})
    role!:(typeof ROLES)[number]

}
