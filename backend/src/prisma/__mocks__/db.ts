// Mock manual de ../db para os testes unitários (ativado com jest.mock('../prisma/db')).
// Evita carregar o runtime ESM do Prisma e conectar ao banco.

type Callback = (builder: unknown) => unknown;

// Construtor "coringa" usado dentro dos callbacks (include, orderBy, aggregate...):
// qualquer propriedade ou chamada devolve ele mesmo, e callbacks recebidos são executados.
export const nestedBuilder: any = new Proxy(function () {}, {
  get: (_target, prop) => (prop === 'then' ? undefined : nestedBuilder),
  apply: (_target, _this, args: unknown[]) => {
    runCallbacks(args);
    return nestedBuilder;
  },
});

function runCallbacks(args: unknown[]) {
  for (const arg of args) {
    if (typeof arg === 'function') (arg as Callback)(nestedBuilder);
  }
}

const CHAIN_METHODS = ['select', 'where', 'orderBy', 'include'] as const;
const TERMINAL_METHODS = [
  'all',
  'first',
  'create',
  'update',
  'delete',
  'aggregate',
] as const;

type ModelMock = Record<
  (typeof CHAIN_METHODS)[number] | (typeof TERMINAL_METHODS)[number],
  jest.Mock
>;

function createModel(): ModelMock {
  const model = {} as ModelMock;
  for (const method of CHAIN_METHODS) {
    model[method] = jest.fn((...args: unknown[]) => {
      runCallbacks(args);
      return model;
    });
  }
  for (const method of TERMINAL_METHODS) model[method] = jest.fn();
  return model;
}

const models = {
  User: createModel(),
  Action: createModel(),
  Registration: createModel(),
};

export const db = {
  orm: { public: models },
  transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(db)),
};

// Limpa chamadas e respostas configuradas, mantendo o encadeamento funcionando
export function resetDbMock() {
  for (const model of Object.values(models)) {
    for (const method of CHAIN_METHODS) model[method].mockClear();
    for (const method of TERMINAL_METHODS) model[method].mockReset();
  }
  db.transaction.mockClear();
}
