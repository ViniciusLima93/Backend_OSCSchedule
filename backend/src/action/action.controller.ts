import { Body, Controller,Get,Post } from '@nestjs/common';
import { ActionService } from './action.service';
import { CreateActionDto } from './dto/create-action.dto';

@Controller('action')
export class ActionController {

    constructor(private actionService: ActionService) {}

    @Post()
    create(@Body() dto: CreateActionDto) {
        return this.actionService.create(dto)
    }


    @Get()
    findAll() {
        return this.actionService.findAll()
    }
}
