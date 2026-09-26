-- =============================================================================
-- OSC Schedule — Esquema do banco de dados (PostgreSQL >= 15)
-- =============================================================================
-- Sistema de agendamento de ações de uma OSC (Organização da Sociedade Civil).
--
-- Entidades:
--   users          Pessoas cadastradas: moradores e organizadores
--   actions        Ações/eventos criados por um organizador
--   registrations  Inscrições de usuários em ações (N:N entre users e actions)
--
-- Relacionamentos:
--   users 1 ──── N actions        (um organizador cria várias ações)
--   users N ──── N actions        (via registrations: moradores se inscrevem)
--
-- Este script é idempotente: remove as tabelas existentes e recria tudo.
-- =============================================================================

BEGIN;

-- Remove as tabelas antigas (inclusive as do modelo anterior "User"/"Action")
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS actions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS "Action" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

-- -----------------------------------------------------------------------------
-- Função de trigger: mantém a coluna updated_at sempre atualizada
-- -----------------------------------------------------------------------------
CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id          SERIAL       PRIMARY KEY,
  name        TEXT         NOT NULL,
  email       TEXT         NOT NULL,
  password    TEXT         NOT NULL,              -- hash bcrypt, nunca texto puro
  role        TEXT         NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT users_email_key       UNIQUE (email),
  CONSTRAINT users_name_not_blank  CHECK (length(trim(name)) > 0),
  CONSTRAINT users_email_format    CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT users_role_valid      CHECK (role IN ('Morador', 'Organizador'))
);

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- actions
-- -----------------------------------------------------------------------------
CREATE TABLE actions (
  id            SERIAL       PRIMARY KEY,
  organizer_id  INTEGER      NOT NULL,
  title         TEXT         NOT NULL,
  description   TEXT         NOT NULL,
  location      TEXT         NOT NULL,
  event_date    TIMESTAMPTZ  NOT NULL,
  vacancies     INTEGER      NOT NULL,
  docs          TEXT[]       NOT NULL DEFAULT '{}',  -- documentos exigidos na ação
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),

  -- Ao remover um organizador, as ações dele também são removidas
  CONSTRAINT actions_organizer_id_fkey
    FOREIGN KEY (organizer_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT actions_title_not_blank     CHECK (length(trim(title)) > 0),
  CONSTRAINT actions_vacancies_positive  CHECK (vacancies > 0),
  CONSTRAINT actions_docs_no_nulls       CHECK (array_position(docs, NULL) IS NULL)
);

CREATE INDEX actions_organizer_id_idx ON actions (organizer_id);
CREATE INDEX actions_event_date_idx   ON actions (event_date);

CREATE TRIGGER actions_set_updated_at
  BEFORE UPDATE ON actions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- registrations (tabela associativa users N:N actions)
-- -----------------------------------------------------------------------------
CREATE TABLE registrations (
  id          SERIAL       PRIMARY KEY,
  user_id     INTEGER      NOT NULL,
  action_id   INTEGER      NOT NULL,
  status      TEXT         NOT NULL DEFAULT 'confirmada',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT registrations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT registrations_action_id_fkey
    FOREIGN KEY (action_id) REFERENCES actions (id) ON DELETE CASCADE,
  -- Um usuário só pode se inscrever uma vez na mesma ação
  CONSTRAINT registrations_user_action_key UNIQUE (user_id, action_id),
  CONSTRAINT registrations_status_valid    CHECK (status IN ('confirmada', 'cancelada'))
);

CREATE INDEX registrations_action_id_idx ON registrations (action_id);

CREATE TRIGGER registrations_set_updated_at
  BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
