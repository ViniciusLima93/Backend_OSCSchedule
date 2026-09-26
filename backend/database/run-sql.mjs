// Executa um ou mais arquivos .sql no banco configurado em DATABASE_URL.
// Uso: node database/run-sql.mjs database/schema.sql database/seed.sql
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Informe ao menos um arquivo .sql');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  for (const file of files) {
    const sql = await readFile(file, 'utf8');
    const results = [].concat(await client.query(sql));
    console.log(`✔ ${file}`);
    for (const result of results) {
      if (result.command === 'SELECT' && result.rows.length > 0) {
        console.table(result.rows);
      }
    }
  }
} catch (error) {
  console.error(`✖ ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
