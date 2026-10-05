import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';

jest.mock('../prisma/db');

describe('RegistrationsController', () => {
  let controller: RegistrationsController;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    cancel: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrationsController],
      providers: [{ provide: RegistrationsService, useValue: service }],
    }).compile();

    controller = module.get<RegistrationsController>(RegistrationsController);
  });

  it('create delega ao serviço', async () => {
    const dto = { userId: 1, actionId: 2 };
    service.create.mockResolvedValue({ id: 1 });

    await expect(controller.create(dto)).resolves.toEqual({ id: 1 });
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('findAll delega ao serviço com os filtros', async () => {
    service.findAll.mockResolvedValue([]);

    await expect(controller.findAll({ userId: 1 })).resolves.toEqual([]);
    expect(service.findAll).toHaveBeenCalledWith({ userId: 1 });
  });

  it('findOne delega ao serviço', async () => {
    service.findOne.mockResolvedValue({ id: 1 });

    await expect(controller.findOne(1)).resolves.toEqual({ id: 1 });
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('cancel delega ao serviço', async () => {
    service.cancel.mockResolvedValue({ id: 1, status: 'cancelada' });

    await expect(controller.cancel(1)).resolves.toEqual({
      id: 1,
      status: 'cancelada',
    });
    expect(service.cancel).toHaveBeenCalledWith(1);
  });

  it('remove delega ao serviço', async () => {
    service.remove.mockResolvedValue({ id: 1 });

    await expect(controller.remove(1)).resolves.toEqual({ id: 1 });
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
