import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../prisma/db';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';

@Injectable()
export class ActionsService {
  async create(dto: CreateActionDto) {
    const organizer = await db.orm.public.User.select('id', 'role').first({
      id: dto.organizerId,
    });
    if (!organizer) {
      throw new NotFoundException(`Usuário ${dto.organizerId} não encontrado`);
    }
    if (organizer.role !== 'Organizador') {
      throw new BadRequestException('Apenas organizadores podem criar ações');
    }

    return db.orm.public.Action.create({
      organizerId: dto.organizerId,
      title: dto.title,
      description: dto.description,
      location: dto.location,
      eventDate: dto.eventDate,
      vacancies: dto.vacancies,
      docs: dto.docs ?? [],
    });
  }

  async findAll() {
    const actions = await db.orm.public.Action.orderBy((a) => a.eventDate.asc())
      .include('organizer', (organizer) => organizer.select('id', 'name'))
      .include('registrations', (registrations) =>
        registrations.where({ status: 'confirmada' }).count(),
      )
      .all();

    return actions.map(({ registrations, ...action }) => ({
      ...action,
      registered: registrations,
      availableVacancies: action.vacancies - registrations,
    }));
  }

  async findOne(id: number) {
    const action = await db.orm.public.Action.where({ id })
      .include('organizer', (organizer) =>
        organizer.select('id', 'name', 'email'),
      )
      // Participantes (N:N via registrations)
      .include('registrations', (registrations) =>
        registrations
          .select('id', 'status', 'createdAt')
          .orderBy((r) => r.createdAt.asc())
          .include('user', (user) => user.select('id', 'name', 'email')),
      )
      .first();

    if (!action) throw new NotFoundException(`Ação ${id} não encontrada`);

    const registered = action.registrations.filter(
      (r) => r.status === 'confirmada',
    ).length;
    return {
      ...action,
      registered,
      availableVacancies: action.vacancies - registered,
    };
  }

  async update(id: number, dto: UpdateActionDto) {
    if (dto.vacancies !== undefined) {
      const registered = await this.countConfirmed(id);
      if (dto.vacancies < registered) {
        throw new BadRequestException(
          `A ação já tem ${registered} inscritos; vagas não podem ser menores que isso`,
        );
      }
    }

    const action = await db.orm.public.Action.where({ id }).update(dto);
    if (!action) throw new NotFoundException(`Ação ${id} não encontrada`);
    return action;
  }

  async remove(id: number) {
    // As inscrições da ação são removidas pelo ON DELETE CASCADE
    const action = await db.orm.public.Action.where({ id }).delete();
    if (!action) throw new NotFoundException(`Ação ${id} não encontrada`);
    return action;
  }

  private async countConfirmed(actionId: number) {
    const { total } = await db.orm.public.Registration.where({
      actionId,
      status: 'confirmada',
    }).aggregate((a) => ({ total: a.count() }));
    return total;
  }
}
