import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationsService } from './registrations.service';

jest.mock('../prisma/db');

const { db, resetDbMock } =
  jest.requireMock<typeof import('../prisma/__mocks__/db')>('../prisma/db');
const { User, Action, Registration } = db.orm.public;

const FUTURE = '2999-01-01T10:00:00.000Z';
const PAST = '2000-01-01T10:00:00.000Z';

describe('RegistrationsService', () => {
  let service: RegistrationsService;

  beforeEach(async () => {
    resetDbMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [RegistrationsService],
    }).compile();

    service = module.get<RegistrationsService>(RegistrationsService);
  });

  describe('create', () => {
    const dto = { userId: 1, actionId: 2 };

    const mockValidUserAndAction = (registrations = 0, vacancies = 10) => {
      User.first.mockResolvedValue({ id: 1, role: 'Morador' });
      Action.first.mockResolvedValue({
        id: 2,
        vacancies,
        eventDate: FUTURE,
        registrations,
      });
    };

    it('cria uma nova inscrição dentro de uma transação', async () => {
      mockValidUserAndAction();
      Registration.first.mockResolvedValue(null);
      Registration.create.mockResolvedValue({ id: 7, status: 'confirmada' });

      await expect(service.create(dto)).resolves.toEqual({
        id: 7,
        status: 'confirmada',
      });
      expect(db.transaction).toHaveBeenCalled();
      expect(User.first).toHaveBeenCalledWith({ id: 1 });
      expect(Action.first).toHaveBeenCalledWith({ id: 2 });
      expect(Registration.where).toHaveBeenCalledWith(dto);
      expect(Registration.create).toHaveBeenCalledWith(dto);
    });

    it('reativa uma inscrição cancelada', async () => {
      mockValidUserAndAction();
      Registration.first.mockResolvedValue({ id: 7, status: 'cancelada' });
      Registration.update.mockResolvedValue({ id: 7, status: 'confirmada' });

      await expect(service.create(dto)).resolves.toEqual({
        id: 7,
        status: 'confirmada',
      });
      expect(Registration.where).toHaveBeenCalledWith({ id: 7 });
      expect(Registration.update).toHaveBeenCalledWith({
        status: 'confirmada',
      });
      expect(Registration.create).not.toHaveBeenCalled();
    });

    it('lança NotFoundException quando o usuário não existe', async () => {
      User.first.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('lança BadRequestException quando o usuário não é morador', async () => {
      User.first.mockResolvedValue({ id: 1, role: 'Organizador' });

      await expect(service.create(dto)).rejects.toThrow(
        'Apenas moradores podem se inscrever',
      );
    });

    it('lança NotFoundException quando a ação não existe', async () => {
      User.first.mockResolvedValue({ id: 1, role: 'Morador' });
      Action.first.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('lança BadRequestException quando a ação já aconteceu', async () => {
      User.first.mockResolvedValue({ id: 1, role: 'Morador' });
      Action.first.mockResolvedValue({
        id: 2,
        vacancies: 10,
        eventDate: PAST,
        registrations: 0,
      });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('lança ConflictException quando o usuário já está inscrito', async () => {
      mockValidUserAndAction();
      Registration.first.mockResolvedValue({ id: 7, status: 'confirmada' });

      await expect(service.create(dto)).rejects.toThrow(
        'Usuário já inscrito nesta ação',
      );
    });

    it('lança ConflictException quando não há vagas', async () => {
      mockValidUserAndAction(10, 10);
      Registration.first.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(Registration.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('lista as inscrições aplicando os filtros', async () => {
      const registrations = [{ id: 1 }];
      Registration.all.mockResolvedValue(registrations);

      await expect(service.findAll({ status: 'confirmada' })).resolves.toBe(
        registrations,
      );
      expect(Registration.where).toHaveBeenCalledWith({ status: 'confirmada' });
    });
  });

  describe('findOne', () => {
    it('devolve a inscrição', async () => {
      Registration.first.mockResolvedValue({ id: 1 });

      await expect(service.findOne(1)).resolves.toEqual({ id: 1 });
      expect(Registration.where).toHaveBeenCalledWith({ id: 1 });
    });

    it('lança NotFoundException quando a inscrição não existe', async () => {
      Registration.first.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('marca a inscrição como cancelada', async () => {
      Registration.update.mockResolvedValue({ id: 1, status: 'cancelada' });

      await expect(service.cancel(1)).resolves.toEqual({
        id: 1,
        status: 'cancelada',
      });
      expect(Registration.update).toHaveBeenCalledWith({ status: 'cancelada' });
    });

    it('lança NotFoundException quando a inscrição não existe', async () => {
      Registration.update.mockResolvedValue(null);

      await expect(service.cancel(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('remove a inscrição', async () => {
      Registration.delete.mockResolvedValue({ id: 1 });

      await expect(service.remove(1)).resolves.toEqual({ id: 1 });
      expect(Registration.where).toHaveBeenCalledWith({ id: 1 });
    });

    it('lança NotFoundException quando a inscrição não existe', async () => {
      Registration.delete.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
