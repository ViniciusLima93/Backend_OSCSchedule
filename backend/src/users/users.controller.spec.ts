import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

jest.mock('../prisma/db');

describe('UsersController', () => {
  let controller: UsersController;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('create delega ao serviço', async () => {
    const dto = {
      name: 'Ana',
      email: 'ana@exemplo.com',
      password: 'segredo123',
      role: 'Morador' as const,
    };
    service.create.mockResolvedValue({ id: 1 });

    await expect(controller.create(dto)).resolves.toEqual({ id: 1 });
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('findAll delega ao serviço', async () => {
    service.findAll.mockResolvedValue([]);

    await expect(controller.findAll()).resolves.toEqual([]);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('findOne delega ao serviço', async () => {
    service.findOne.mockResolvedValue({ id: 1 });

    await expect(controller.findOne(1)).resolves.toEqual({ id: 1 });
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('update delega ao serviço', async () => {
    service.update.mockResolvedValue({ id: 1, name: 'Bia' });

    await expect(controller.update(1, { name: 'Bia' })).resolves.toEqual({
      id: 1,
      name: 'Bia',
    });
    expect(service.update).toHaveBeenCalledWith(1, { name: 'Bia' });
  });

  it('remove delega ao serviço', async () => {
    service.remove.mockResolvedValue({ id: 1 });

    await expect(controller.remove(1)).resolves.toEqual({ id: 1 });
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
