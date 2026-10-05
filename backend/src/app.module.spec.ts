import { Test } from '@nestjs/testing';
import { ActionsController } from './actions/actions.controller';
import { AppModule } from './app.module';
import { RegistrationsController } from './registrations/registrations.controller';
import { UsersController } from './users/users.controller';

jest.mock('./prisma/db');

describe('AppModule', () => {
  it('monta todos os módulos da aplicação', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(module.get(UsersController)).toBeInstanceOf(UsersController);
    expect(module.get(ActionsController)).toBeInstanceOf(ActionsController);
    expect(module.get(RegistrationsController)).toBeInstanceOf(
      RegistrationsController,
    );
  });
});
