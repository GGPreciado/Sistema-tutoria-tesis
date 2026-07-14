import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: path.join(__dirname, '../../../../../.env') });

// Orden irrelevante: TRUNCATE ... CASCADE arrastra las tablas dependientes.
const TABLAS = [
  'usuario_logros',
  'logros',
  'puntos_curso',
  'resultados_evaluacion',
  'respuestas_evaluacion',
  'evaluaciones',
  'opciones',
  'preguntas',
  'temas',
  'cursos',
  'usuarios',
];

async function main(): Promise<void> {
  const confirmado = process.argv.includes('--yes');
  if (!confirmado) {
    console.error(
      'Este script BORRA TODOS LOS DATOS de la base de datos (todas las tablas).\n' +
      'Vuelve a ejecutarlo con --yes para confirmar, ej:\n' +
      '  npm run db:reset -- --yes',
    );
    process.exit(1);
  }

  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'tutoria',
    entities: [],
    synchronize: false,
  });

  await ds.initialize();
  const qr = ds.createQueryRunner();
  await qr.connect();

  try {
    console.log(`Truncando ${TABLAS.length} tabla(s): ${TABLAS.join(', ')}`);
    await qr.query(`TRUNCATE TABLE ${TABLAS.join(', ')} RESTART IDENTITY CASCADE`);
    console.log('Listo. Todas las tablas quedaron vacías (contadores serial reiniciados).');

    const [counts] = await qr.query(`
      SELECT
        (SELECT count(*)::int FROM usuarios)    AS usuarios,
        (SELECT count(*)::int FROM cursos)      AS cursos,
        (SELECT count(*)::int FROM temas)       AS temas,
        (SELECT count(*)::int FROM preguntas)   AS preguntas,
        (SELECT count(*)::int FROM opciones)    AS opciones,
        (SELECT count(*)::int FROM evaluaciones) AS evaluaciones,
        (SELECT count(*)::int FROM logros)      AS logros
    `);
    console.log('\nConteo por tabla tras el reset:');
    console.table(counts);
  } finally {
    await qr.release();
    await ds.destroy();
  }
}

main().catch((err: unknown) => {
  console.error('Error ejecutando reset:', err);
  process.exit(1);
});
