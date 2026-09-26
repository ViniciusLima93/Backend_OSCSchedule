-- =============================================================================
-- OSC Schedule — Dados de exemplo (INSERT)
-- =============================================================================
-- Executar depois do schema.sql. Limpa as tabelas e reinicia os IDs.
-- Senha de todos os usuários de exemplo: senha1234 (armazenada como hash bcrypt)
-- =============================================================================

BEGIN;

TRUNCATE registrations, actions, users RESTART IDENTITY CASCADE;

-- -----------------------------------------------------------------------------
-- Usuários: 2 organizadores e 5 moradores
-- -----------------------------------------------------------------------------
INSERT INTO users (name, email, password, role) VALUES
  ('Ana Souza',       'ana@osc.org',      '$2b$10$Esqsz.n1e9JnDu5erjH6dOEJDBfyRyx4bYHKTYZM3JuiBgbcu7HtK', 'Organizador'), -- id 1
  ('Carlos Pereira',  'carlos@osc.org',   '$2b$10$Esqsz.n1e9JnDu5erjH6dOEJDBfyRyx4bYHKTYZM3JuiBgbcu7HtK', 'Organizador'), -- id 2
  ('Beatriz Lima',    'beatriz@mail.com', '$2b$10$Esqsz.n1e9JnDu5erjH6dOEJDBfyRyx4bYHKTYZM3JuiBgbcu7HtK', 'Morador'),     -- id 3
  ('Diego Santos',    'diego@mail.com',   '$2b$10$Esqsz.n1e9JnDu5erjH6dOEJDBfyRyx4bYHKTYZM3JuiBgbcu7HtK', 'Morador'),     -- id 4
  ('Elisa Rocha',     'elisa@mail.com',   '$2b$10$Esqsz.n1e9JnDu5erjH6dOEJDBfyRyx4bYHKTYZM3JuiBgbcu7HtK', 'Morador'),     -- id 5
  ('Fábio Oliveira',  'fabio@mail.com',   '$2b$10$Esqsz.n1e9JnDu5erjH6dOEJDBfyRyx4bYHKTYZM3JuiBgbcu7HtK', 'Morador'),     -- id 6
  ('Helena Costa',    'helena@mail.com',  '$2b$10$Esqsz.n1e9JnDu5erjH6dOEJDBfyRyx4bYHKTYZM3JuiBgbcu7HtK', 'Morador');     -- id 7 (sem inscrições)

-- -----------------------------------------------------------------------------
-- Ações
-- -----------------------------------------------------------------------------
INSERT INTO actions (organizer_id, title, description, location, event_date, vacancies, docs) VALUES
  (1, 'Mutirão de limpeza da praça',
      'Limpeza e plantio de mudas na praça central do bairro.',
      'Praça Central', '2026-10-10 08:00:00-03', 20, '{}'),                              -- id 1
  (1, 'Oficina de currículo',
      'Orientação para montar currículo e se preparar para entrevistas.',
      'Sede da OSC - Sala 2', '2026-10-15 14:00:00-03', 3, '{"RG","CPF"}'),              -- id 2
  (2, 'Campanha de vacinação',
      'Vacinação contra gripe em parceria com a UBS do bairro.',
      'UBS Vila Nova', '2026-10-20 09:00:00-03', 50, '{"Cartão SUS","Carteira de vacinação"}'), -- id 3
  (2, 'Aula de reforço escolar',
      'Reforço de matemática e português para o ensino fundamental.',
      'Escola Municipal Aurora', '2026-09-01 18:00:00-03', 10, '{"Boletim escolar"}');  -- id 4 (já aconteceu)

-- -----------------------------------------------------------------------------
-- Inscrições
-- -----------------------------------------------------------------------------
INSERT INTO registrations (user_id, action_id, status) VALUES
  (3, 1, 'confirmada'),
  (4, 1, 'confirmada'),
  (5, 1, 'cancelada'),
  (3, 2, 'confirmada'),
  (4, 2, 'confirmada'),
  (6, 2, 'confirmada'),   -- ação 2 fica lotada (3 vagas)
  (5, 3, 'confirmada'),
  (6, 4, 'confirmada');

COMMIT;
