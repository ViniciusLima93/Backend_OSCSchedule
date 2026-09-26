import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Response } from 'express';

// Formato dos erros de SQL lançados pelo Prisma 8 (kind: 'sql_query')
interface SqlQueryError {
  kind: 'sql_query';
  sqlState: string;
  constraint?: string;
  detail?: string;
}

// Mensagens amigáveis para as restrições definidas em database/schema.sql
const CONSTRAINT_MESSAGES: Record<string, string> = {
  users_email_key: 'E-mail já cadastrado',
  users_role_valid: 'Função inválida (use Morador ou Organizador)',
  users_name_not_blank: 'Nome é obrigatório',
  users_email_format: 'E-mail inválido',
  actions_organizer_id_fkey: 'Organizador não encontrado',
  actions_title_not_blank: 'Título é obrigatório',
  actions_vacancies_positive: 'O número de vagas deve ser maior que zero',
  registrations_user_id_fkey: 'Usuário não encontrado',
  registrations_action_id_fkey: 'Ação não encontrada',
  registrations_user_action_key: 'Usuário já inscrito nesta ação',
  registrations_status_valid: 'Status de inscrição inválido',
};

// Códigos SQLSTATE do PostgreSQL → status HTTP
const SQLSTATE_TO_HTTP: Record<string, HttpStatus> = {
  '23505': HttpStatus.CONFLICT, // unique_violation
  '23503': HttpStatus.BAD_REQUEST, // foreign_key_violation
  '23514': HttpStatus.BAD_REQUEST, // check_violation
  '23502': HttpStatus.BAD_REQUEST, // not_null_violation
};

function isSqlQueryError(error: unknown): error is SqlQueryError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as SqlQueryError).kind === 'sql_query' &&
    typeof (error as SqlQueryError).sqlState === 'string'
  );
}

@Catch()
export class DatabaseExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  catch(exception: unknown, host: ArgumentsHost) {
    const status = isSqlQueryError(exception)
      ? SQLSTATE_TO_HTTP[exception.sqlState]
      : undefined;

    if (!isSqlQueryError(exception) || status === undefined) {
      return super.catch(exception, host);
    }

    const message =
      (exception.constraint && CONSTRAINT_MESSAGES[exception.constraint]) ??
      exception.detail ??
      'Violação de restrição do banco de dados';

    host.switchToHttp().getResponse<Response>().status(status).json({
      statusCode: status,
      message,
      constraint: exception.constraint,
    });
  }
}
