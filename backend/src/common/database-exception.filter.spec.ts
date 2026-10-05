import { ArgumentsHost, HttpStatus, NotFoundException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { DatabaseExceptionFilter } from './database-exception.filter';

describe('DatabaseExceptionFilter', () => {
  const filter = new DatabaseExceptionFilter();
  const response = { status: jest.fn(), json: jest.fn() };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;
  let superCatch: jest.SpyInstance;

  beforeEach(() => {
    response.status.mockReset().mockReturnValue(response);
    response.json.mockReset();
    superCatch = jest
      .spyOn(BaseExceptionFilter.prototype, 'catch')
      .mockImplementation(() => undefined);
  });

  afterEach(() => superCatch.mockRestore());

  const sqlError = (fields: Record<string, unknown>) => ({
    kind: 'sql_query',
    ...fields,
  });

  it.each([
    ['uma HttpException', new NotFoundException()],
    ['null', null],
    ['um valor que não é objeto', 'falha'],
    ['um objeto de outro tipo', { kind: 'outro', sqlState: '23505' }],
    ['um erro sem sqlState em texto', { kind: 'sql_query', sqlState: 23505 }],
    ['um SQLSTATE não mapeado', sqlError({ sqlState: '42P01' })],
  ])('repassa ao filtro padrão quando recebe %s', (_label, exception) => {
    filter.catch(exception, host);

    expect(superCatch).toHaveBeenCalledWith(exception, host);
    expect(response.status).not.toHaveBeenCalled();
  });

  it('usa a mensagem amigável da restrição', () => {
    filter.catch(
      sqlError({ sqlState: '23505', constraint: 'users_email_key' }),
      host,
    );

    expect(superCatch).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      message: 'E-mail já cadastrado',
      constraint: 'users_email_key',
    });
  });

  it('usa o detail quando a restrição não tem mensagem própria', () => {
    filter.catch(
      sqlError({
        sqlState: '23503',
        constraint: 'restricao_desconhecida',
        detail: 'Key (x)=(1) is not present',
      }),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Key (x)=(1) is not present',
      constraint: 'restricao_desconhecida',
    });
  });

  it('usa o detail quando não há restrição', () => {
    filter.catch(sqlError({ sqlState: '23502', detail: 'coluna nula' }), host);

    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'coluna nula',
      constraint: undefined,
    });
  });

  it('usa a mensagem genérica sem restrição nem detail', () => {
    filter.catch(sqlError({ sqlState: '23514' }), host);

    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Violação de restrição do banco de dados',
      constraint: undefined,
    });
  });
});
