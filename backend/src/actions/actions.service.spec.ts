import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ActionsService } from './actions.service';

jest.mock('../prisma/db');

const { db, resetDbMock, nestedBuilder } =
  jest.requireMock<typeof import('../prisma/__mocks__/db')>('../prisma/db');
const { User, Action, Registration } = db.orm.public;

describe('ActionsService', () => {
  let service: ActionsService;

  const dto = {
    organizerId: 1,
    title: 'Mutirão',
    description: 'Limpeza da praça',
    location: 'Praça Central',
    eventDate: '2030-01-01T10:00:00.000Z',
    vacancies: 10,
  };

  beforeEach(async () => {
    resetDbMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ActionsService],
    }).compile();

    service = module.get<ActionsService>(ActionsService);
  });

  describe('create', () => {
    it('cria a ação com docs vazio por padrão', async () => {
      User.first.mockResolvedValue({ id: 1, role: 'Organizador' });
      Action.create.mockResolvedValue({ id: 5 });

      await expect(service.create(dto)).resolves.toEqual({ id: 5 });
      expect(User.first).toHaveBeenCalledWith({ id: 1 });
      expect(Action.create).toHaveBeenCalledWith({ ...dto, docs: [] });
    });

    it('mantém os docs enviados', async () => {
      User.first.mockResolvedValue({ id: 1, role: 'Organizador' });
      Action.create.mockResolvedValue({ id: 5 });

      await service.create({ ...dto, docs: ['termo.pdf'] });

      expect(Action.create).toHaveBeenCalledWith({
        ...dto,
        docs: ['termo.pdf'],
      });
    });

    it('lança NotFoundException quando o organizador não existe', async () => {
      User.first.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(Action.create).not.toHaveBeenCalled();
    });

    it('lança BadRequestException quando o usuário não é organizador', async () => {
      User.first.mockResolvedValue({ id: 1, role: 'Morador' });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(Action.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('calcula inscritos e vagas disponíveis', async () => {
      Action.all.mockResolvedValue([
        { id: 1, vacancies: 10, registrations: 3 },
        { id: 2, vacancies: 5, registrations: 5 },
      ]);

      await expect(service.findAll()).resolves.toEqual([
        { id: 1, vacancies: 10, registered: 3, availableVacancies: 7 },
        { id: 2, vacancies: 5, registered: 5, availableVacancies: 0 },
      ]);
    });
  });

  describe('findOne', () => {
    it('conta só as inscrições confirmadas', async () => {
      const registrations = [
        { id: 1, status: 'confirmada' },
        { id: 2, status: 'cancelada' },
        { id: 3, status: 'confirmada' },
      ];
      Action.first.mockResolvedValue({ id: 1, vacancies: 10, registrations });

      await expect(service.findOne(1)).resolves.toEqual({
        id: 1,
        vacancies: 10,
        registrations,
        registered: 2,
        availableVacancies: 8,
      });
      expect(Action.where).toHaveBeenCalledWith({ id: 1 });
    });

    it('lança NotFoundException quando a ação não existe', async () => {
      Action.first.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    // aggregate recebe um callback; executa-o para refletir o uso real
    const mockConfirmed = (total: number) =>
      Registration.aggregate.mockImplementation(
        (fn: (a: unknown) => unknown) => {
          fn(nestedBuilder);
          return Promise.resolve({ total });
        },
      );

    it('atualiza sem checar inscritos quando as vagas não mudam', async () => {
      Action.update.mockResolvedValue({ id: 1, title: 'Novo' });

      await expect(service.update(1, { title: 'Novo' })).resolves.toEqual({
        id: 1,
        title: 'Novo',
      });
      expect(Registration.aggregate).not.toHaveBeenCalled();
      expect(Action.update).toHaveBeenCalledWith({ title: 'Novo' });
    });

    it('permite vagas maiores ou iguais ao número de inscritos', async () => {
      mockConfirmed(4);
      Action.update.mockResolvedValue({ id: 1, vacancies: 4 });

      await expect(service.update(1, { vacancies: 4 })).resolves.toEqual({
        id: 1,
        vacancies: 4,
      });
      expect(Registration.where).toHaveBeenCalledWith({
        actionId: 1,
        status: 'confirmada',
      });
    });

    it('rejeita vagas menores que o número de inscritos', async () => {
      mockConfirmed(4);

      await expect(service.update(1, { vacancies: 3 })).rejects.toThrow(
        BadRequestException,
      );
      expect(Action.update).not.toHaveBeenCalled();
    });

    it('lança NotFoundException quando a ação não existe', async () => {
      Action.update.mockResolvedValue(null);

      await expect(service.update(99, { title: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('remove a ação', async () => {
      Action.delete.mockResolvedValue({ id: 1 });

      await expect(service.remove(1)).resolves.toEqual({ id: 1 });
      expect(Action.where).toHaveBeenCalledWith({ id: 1 });
    });

    it('lança NotFoundException quando a ação não existe', async () => {
      Action.delete.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
