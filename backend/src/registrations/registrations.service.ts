import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../prisma/db';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { FindRegistrationsDto } from './dto/find-registrations.dto';

@Injectable()
export class RegistrationsService {
  // Inscreve um morador em uma ação. Roda em transação para que a checagem
  // de vagas e a gravação da inscrição aconteçam juntas.
  async create({ userId, actionId }: CreateRegistrationDto) {
    return db.transaction(async (tx) => {
      const user = await tx.orm.public.User.select('id', 'role').first({
        id: userId,
      });
      if (!user) throw new NotFoundException(`Usuário ${userId} não encontrado`);
      if (user.role !== 'Morador') {
        throw new BadRequestException('Apenas moradores podem se inscrever');
      }

      const action = await tx.orm.public.Action.select(
        'id',
        'vacancies',
        'eventDate',
      )
        .include('registrations', (registrations) =>
          registrations.where({ status: 'confirmada' }).count(),
        )
        .first({ id: actionId });
      if (!action) throw new NotFoundException(`Ação ${actionId} não encontrada`);
      if (new Date(action.eventDate) < new Date()) {
        throw new BadRequestException('Esta ação já aconteceu');
      }

      const existing = await tx.orm.public.Registration.where({
        userId,
        actionId,
      }).first();
      if (existing?.status === 'confirmada') {
        throw new ConflictException('Usuário já inscrito nesta ação');
      }
      if (action.registrations >= action.vacancies) {
        throw new ConflictException('Não há vagas disponíveis nesta ação');
      }
      // Quem cancelou pode se inscrever de novo: reativa a inscrição
      if (existing) {
        return tx.orm.public.Registration.where({ id: existing.id }).update({
          status: 'confirmada',
        });
      }

      return tx.orm.public.Registration.create({ userId, actionId });
    });
  }

  async findAll(filters: FindRegistrationsDto) {
    return db.orm.public.Registration.where(filters)
      .orderBy((r) => r.createdAt.desc())
      .include('user', (user) => user.select('id', 'name', 'email'))
      .include('action', (action) =>
        action.select('id', 'title', 'eventDate', 'location'),
      )
      .all();
  }

  async findOne(id: number) {
    const registration = await db.orm.public.Registration.where({ id })
      .include('user', (user) => user.select('id', 'name', 'email'))
      .include('action', (action) =>
        action.select('id', 'title', 'eventDate', 'location'),
      )
      .first();

    if (!registration) {
      throw new NotFoundException(`Inscrição ${id} não encontrada`);
    }
    return registration;
  }

  async cancel(id: number) {
    const registration = await db.orm.public.Registration.where({ id }).update({
      status: 'cancelada',
    });
    if (!registration) {
      throw new NotFoundException(`Inscrição ${id} não encontrada`);
    }
    return registration;
  }

  async remove(id: number) {
    const registration = await db.orm.public.Registration.where({
      id,
    }).delete();
    if (!registration) {
      throw new NotFoundException(`Inscrição ${id} não encontrada`);
    }
    return registration;
  }
}
