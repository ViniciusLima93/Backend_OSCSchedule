import { Injectable } from '@nestjs/common';
import { CreateActionDto } from './dto/create-action.dto.js';

import { db } from '../prisma/db.js';


@Injectable()
export class ActionService {


    async create(dto:CreateActionDto) {
        const action = await db.orm.public.Action.create({
            title:dto.title,
            description:dto.description,
            location:dto.location,
            eventDate:dto.eventDate,
            vacancies:dto.vacancies,
            docs:dto.docs
        })
        
        return action
    }

}
