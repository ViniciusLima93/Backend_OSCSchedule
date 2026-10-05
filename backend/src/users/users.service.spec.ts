import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import { UsersService } from './users.service';

jest.mock('../prisma/db');
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password: string) => Promise.resolve(`hashed:${password}`)),
}));

const { db, resetDbMock } =
  jest.requireMock<typeof import('../prisma/__mocks__/db')>('../prisma/db');
const User = db.orm.public.User;

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    resetDbMock();
    (hash as jest.Mock).mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('grava o usuário com a senha em hash', async () => {
      const created = { id: 1, name: 'Ana' };
      User.create.mockResolvedValue(created);

      const result = await service.create({
        name: 'Ana',
        email: 'ana@exemplo.com',
        password: 'segredo123',
        role: 'Morador',
      });

      expect(result).toBe(created);
      expect(hash).toHaveBeenCalledWith('segredo123', 10);
      expect(User.create).toHaveBeenCalledWith({
        name: 'Ana',
        email: 'ana@exemplo.com',
        password: 'hashed:segredo123',
        role: 'Morador',
      });
      expect(User.select).toHaveBeenCalledWith(
        'id',
        'name',
        'email',
        'role',
        'createdAt',
        'updatedAt',
      );
    });
  });

  describe('findAll', () => {
    it('lista os usuários', async () => {
      const users = [{ id: 1 }, { id: 2 }];
      User.all.mockResolvedValue(users);

      await expect(service.findAll()).resolves.toBe(users);
      expect(User.orderBy).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('devolve o usuário com ações e inscrições', async () => {
      const user = { id: 1, actions: [], registrations: [] };
      User.first.mockResolvedValue(user);

      await expect(service.findOne(1)).resolves.toBe(user);
      expect(User.where).toHaveBeenCalledWith({ id: 1 });
      expect(User.include).toHaveBeenCalledWith(
        'actions',
        expect.any(Function),
      );
      expect(User.include).toHaveBeenCalledWith(
        'registrations',
        expect.any(Function),
      );
    });

    it('lança NotFoundException quando o usuário não existe', async () => {
      User.first.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('atualiza sem mexer na senha quando ela não é enviada', async () => {
      const user = { id: 1, name: 'Bia' };
      User.update.mockResolvedValue(user);

      await expect(service.update(1, { name: 'Bia' })).resolves.toBe(user);
      expect(hash).not.toHaveBeenCalled();
      expect(User.where).toHaveBeenCalledWith({ id: 1 });
      expect(User.update).toHaveBeenCalledWith({ name: 'Bia' });
    });

    it('faz hash da nova senha', async () => {
      User.update.mockResolvedValue({ id: 1 });

      await service.update(1, { password: 'novaSenha1' });

      expect(User.update).toHaveBeenCalledWith({
        password: 'hashed:novaSenha1',
      });
    });

    it('lança NotFoundException quando o usuário não existe', async () => {
      User.update.mockResolvedValue(null);

      await expect(service.update(99, { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('remove o usuário', async () => {
      const user = { id: 1 };
      User.delete.mockResolvedValue(user);

      await expect(service.remove(1)).resolves.toBe(user);
      expect(User.where).toHaveBeenCalledWith({ id: 1 });
    });

    it('lança NotFoundException quando o usuário não existe', async () => {
      User.delete.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
