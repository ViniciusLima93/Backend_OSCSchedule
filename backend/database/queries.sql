-- =============================================================================
-- OSC Schedule — Operações de manipulação e consultas
-- =============================================================================
-- Demonstra INSERT, UPDATE, DELETE e SELECT (com JOIN, agregação e subconsulta).
-- Executar depois do seed.sql. Tudo roda dentro de uma transação que é
-- desfeita no final (ROLLBACK), então o banco volta ao estado do seed.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- INSERÇÃO
-- -----------------------------------------------------------------------------

-- Novo morador
INSERT INTO users (name, email, password, role)
VALUES ('Gabriela Alves', 'gabriela@mail.com',
        '$2b$10$Esqsz.n1e9JnDu5erjH6dOEJDBfyRyx4bYHKTYZM3JuiBgbcu7HtK', 'Morador');

-- Inscrição do novo morador na campanha de vacinação, buscando os IDs por
-- e-mail e título (INSERT ... SELECT)
INSERT INTO registrations (user_id, action_id)
SELECT u.id, a.id
FROM users u, actions a
WHERE u.email = 'gabriela@mail.com'
  AND a.title = 'Campanha de vacinação';

-- -----------------------------------------------------------------------------
-- ATUALIZAÇÃO
-- -----------------------------------------------------------------------------

-- Aumenta as vagas do mutirão de limpeza (o trigger atualiza updated_at)
UPDATE actions
SET vacancies = vacancies + 2
WHERE title = 'Mutirão de limpeza da praça';

-- Cancela a inscrição de um morador em uma ação
UPDATE registrations
SET status = 'cancelada'
WHERE user_id = (SELECT id FROM users WHERE email = 'diego@mail.com')
  AND action_id = 1;

-- -----------------------------------------------------------------------------
-- REMOÇÃO
-- -----------------------------------------------------------------------------

-- Remove inscrições canceladas
DELETE FROM registrations
WHERE status = 'cancelada';

-- Remove ações que já aconteceram (as inscrições delas são removidas em
-- cascata por causa do ON DELETE CASCADE)
DELETE FROM actions
WHERE event_date < now();

-- -----------------------------------------------------------------------------
-- CONSULTAS
-- -----------------------------------------------------------------------------

-- 1. Próximas ações com o nome do organizador (JOIN 1:N)
SELECT a.id, a.title, a.event_date, a.location, u.name AS organizador
FROM actions a
JOIN users u ON u.id = a.organizer_id
WHERE a.event_date >= now()
ORDER BY a.event_date;

-- 2. Vagas ocupadas e restantes por ação (LEFT JOIN + agregação)
SELECT a.id,
       a.title,
       a.vacancies                                      AS vagas,
       COUNT(r.id)                                      AS inscritos,
       a.vacancies - COUNT(r.id)                        AS vagas_restantes
FROM actions a
LEFT JOIN registrations r
       ON r.action_id = a.id AND r.status = 'confirmada'
GROUP BY a.id
ORDER BY a.event_date;

-- 3. Ações lotadas (HAVING)
SELECT a.id, a.title, a.vacancies, COUNT(r.id) AS inscritos
FROM actions a
JOIN registrations r ON r.action_id = a.id AND r.status = 'confirmada'
GROUP BY a.id
HAVING COUNT(r.id) >= a.vacancies;

-- 4. Participantes confirmados de cada ação (JOIN N:N via registrations)
SELECT a.title AS acao, u.name AS participante, u.email, r.created_at AS inscrito_em
FROM registrations r
JOIN users   u ON u.id = r.user_id
JOIN actions a ON a.id = r.action_id
WHERE r.status = 'confirmada'
ORDER BY a.title, u.name;

-- 5. Total de ações e de inscrições por organizador
SELECT u.name                       AS organizador,
       COUNT(DISTINCT a.id)         AS total_acoes,
       COUNT(r.id)                  AS total_inscricoes
FROM users u
LEFT JOIN actions a       ON a.organizer_id = u.id
LEFT JOIN registrations r ON r.action_id = a.id AND r.status = 'confirmada'
WHERE u.role = 'Organizador'
GROUP BY u.id
ORDER BY total_inscricoes DESC;

-- 6. Moradores que ainda não se inscreveram em nenhuma ação (NOT EXISTS)
SELECT u.id, u.name, u.email
FROM users u
WHERE u.role = 'Morador'
  AND NOT EXISTS (
    SELECT 1 FROM registrations r
    WHERE r.user_id = u.id AND r.status = 'confirmada'
  );

-- 7. Ações que exigem um documento específico (operador de array)
SELECT id, title, docs
FROM actions
WHERE 'CPF' = ANY (docs);

-- -----------------------------------------------------------------------------
-- RESTRIÇÕES EM AÇÃO (cada comando abaixo falharia; descomente para testar)
-- -----------------------------------------------------------------------------
-- INSERT INTO users (name, email, password, role)
--   VALUES ('X', 'ana@osc.org', 'x', 'Morador');          -- e-mail duplicado (UNIQUE)
-- INSERT INTO users (name, email, password, role)
--   VALUES ('X', 'x@mail.com', 'x', 'Admin');             -- papel inválido (CHECK)
-- INSERT INTO actions (organizer_id, title, description, location, event_date, vacancies)
--   VALUES (999, 'X', 'X', 'X', now(), 10);               -- organizador inexistente (FK)
-- UPDATE actions SET vacancies = 0 WHERE id = 1;           -- vagas <= 0 (CHECK)
-- INSERT INTO registrations (user_id, action_id)
--   VALUES (3, 1);                                        -- inscrição repetida (UNIQUE)

ROLLBACK;
