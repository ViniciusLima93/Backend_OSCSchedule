import { Body, Controller,Post } from '@nestjs/common';
import { ActionService } from './action.service.js';
import { CreateActionDto } from './dto/create-action.dto.js';

@Controller('action')
export class ActionController {

    constructor(private actionService: ActionService) {}

    @Post()
    create(@Body() dto: CreateActionDto) {
        return this.actionService.create(dto)
    }
}
