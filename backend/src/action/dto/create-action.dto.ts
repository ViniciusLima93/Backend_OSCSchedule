import { IsDateString, isDateString, IsInt, isObject, IsObject, IsString, Min } from "@nestjs/class-validator";


export class CreateActionDto {

    @IsString()
    title!: string

    @IsString()
    description!: string

    @IsString()
    location!: string

    @IsDateString()
    eventDate!: string;

    @IsInt({message: 'Deve ser um número inteiro'})
    @Min(1,{message: 'Deve ser um número maior ou igual 1'})
    vacancies!: number



    @IsObject({ message: "Documentos inválidos!" })
    docs!: string[]


}