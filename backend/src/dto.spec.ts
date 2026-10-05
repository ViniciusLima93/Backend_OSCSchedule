import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateActionDto } from './actions/dto/create-action.dto';
import { UpdateActionDto } from './actions/dto/update-action.dto';
import { CreateRegistrationDto } from './registrations/dto/create-registration.dto';
import { FindRegistrationsDto } from './registrations/dto/find-registrations.dto';
import { CreateUserDto } from './users/dto/create-user.dto';
import { UpdateUserDto } from './users/dto/update-user.dto';

// Valida um objeto como o ValidationPipe faria (transform + whitelist)
async function errorsFor<T extends object>(
  cls: new () => T,
  plain: Record<string, unknown>,
) {
  const instance = plainToInstance(cls, plain);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { instance, fields: errors.map((e) => e.property) };
}

describe('DTOs', () => {
  describe('CreateUserDto', () => {
    const valid = {
      name: 'Ana',
      email: 'ana@exemplo.com',
      password: 'segredo123',
      role: 'Morador',
    };

    it('aceita um usuário válido', async () => {
      expect((await errorsFor(CreateUserDto, valid)).fields).toEqual([]);
    });

    it('rejeita campos inválidos', async () => {
      const { fields } = await errorsFor(CreateUserDto, {
        name: '',
        email: 'invalido',
        password: 'curta',
        role: 'Admin',
      });
      expect(fields).toEqual(['name', 'email', 'password', 'role']);
    });
  });

  describe('UpdateUserDto', () => {
    it('torna todos os campos opcionais', async () => {
      expect((await errorsFor(UpdateUserDto, {})).fields).toEqual([]);
    });
  });

  describe('CreateActionDto', () => {
    const valid = {
      organizerId: 1,
      title: 'Mutirão',
      description: 'Limpeza da praça',
      location: 'Praça Central',
      eventDate: '2030-01-01T10:00:00.000Z',
      vacancies: 10,
      docs: ['termo.pdf'],
    };

    it('aceita uma ação válida', async () => {
      expect((await errorsFor(CreateActionDto, valid)).fields).toEqual([]);
    });

    it('rejeita campos inválidos', async () => {
      const { fields } = await errorsFor(CreateActionDto, {
        ...valid,
        organizerId: 'um',
        title: '',
        eventDate: 'amanhã',
        vacancies: 0,
        docs: [1],
      });
      expect(fields).toEqual([
        'organizerId',
        'title',
        'eventDate',
        'vacancies',
        'docs',
      ]);
    });
  });

  describe('UpdateActionDto', () => {
    it('não permite trocar o organizador', async () => {
      const { fields } = await errorsFor(UpdateActionDto, { organizerId: 2 });
      expect(fields).toEqual(['organizerId']);
    });
  });

  describe('CreateRegistrationDto', () => {
    it('exige ids inteiros', async () => {
      const { fields } = await errorsFor(CreateRegistrationDto, {
        userId: '1',
        actionId: 1.5,
      });
      expect(fields).toEqual(['userId', 'actionId']);
    });
  });

  describe('FindRegistrationsDto', () => {
    it('converte os ids da query string para número', async () => {
      const { instance, fields } = await errorsFor(FindRegistrationsDto, {
        userId: '1',
        actionId: '2',
        status: 'cancelada',
      });
      expect(fields).toEqual([]);
      expect(instance).toEqual({ userId: 1, actionId: 2, status: 'cancelada' });
    });

    it('rejeita status desconhecido', async () => {
      const { fields } = await errorsFor(FindRegistrationsDto, {
        status: 'pendente',
      });
      expect(fields).toEqual(['status']);
    });
  });
});
