import { Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { db } from '../prisma/db';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Campos devolvidos pela API — a senha (hash) nunca sai do banco
const PUBLIC_FIELDS = ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'] as const;
const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  async create(dto: CreateUserDto) {
    return db.orm.public.User.select(...PUBLIC_FIELDS).create({
      name: dto.name,
      email: dto.email,
      password: await hash(dto.password, SALT_ROUNDS),
      role: dto.role,
    });
  }

  async findAll() {
    return db.orm.public.User.select(...PUBLIC_FIELDS)
      .orderBy((u) => u.id.asc())
      .all();
  }

  async findOne(id: number) {
    const user = await db.orm.public.User.select(...PUBLIC_FIELDS)
      .where({ id })
      // Ações que o usuário organiza (1:N)
      .include('actions', (actions) =>
        actions
          .select('id', 'title', 'eventDate', 'vacancies')
          .orderBy((a) => a.eventDate.asc()),
      )
      // Inscrições do usuário, com os dados da ação (N:N)
      .include('registrations', (registrations) =>
        registrations
          .select('id', 'status', 'createdAt')
          .include('action', (action) =>
            action.select('id', 'title', 'eventDate', 'location'),
          ),
      )
      .first();

    if (!user) throw new NotFoundException(`Usuário ${id} não encontrado`);
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    const data = { ...dto };
    if (dto.password) data.password = await hash(dto.password, SALT_ROUNDS);

    const user = await db.orm.public.User.where({ id })
      .select(...PUBLIC_FIELDS)
      .update(data);

    if (!user) throw new NotFoundException(`Usuário ${id} não encontrado`);
    return user;
  }

  async remove(id: number) {
    const user = await db.orm.public.User.where({ id })
      .select(...PUBLIC_FIELDS)
      .delete();

    if (!user) throw new NotFoundException(`Usuário ${id} não encontrado`);
    return user;
  }
}
