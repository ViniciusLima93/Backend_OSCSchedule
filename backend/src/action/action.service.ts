import { Injectable } from '@nestjs/common';
import { CreateActionDto } from './dto/create-action.dto';

@Injectable()
export class ActionService {


    async create(dto:CreateActionDto) {
        const action = dto
        
        return action
    }

}
