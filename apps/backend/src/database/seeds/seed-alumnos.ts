import 'reflect-metadata';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: path.join(__dirname, '../../../../../.env') });

const BCRYPT_ROUNDS = 10;
const CANTIDAD_ALUMNOS = 20;
const PASSWORD_DEFAULT = '123456789';

async function main(): Promise<void> {
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
    console.log(`Insertando ${CANTIDAD_ALUMNOS} cuenta(s) ALUMNO1..ALUMNO${CANTIDAD_ALUMNOS}...`);
    const passwordHash = await bcrypt.hash(PASSWORD_DEFAULT, BCRYPT_ROUNDS);

    let insertados = 0;
    let omitidos = 0;
    for (let i = 1; i <= CANTIDAD_ALUMNOS; i++) {
      const codigo = `ALUMNO${i}`;
      const nombre = `Alumno ${i}`;
      const inserted = await qr.query(
        `INSERT INTO usuarios (nombre, codigo, password_hash, rol, estado)
         VALUES ($1, $2, $3, 'estudiante'::rol_usuario, 'activo'::estado_usuario)
         ON CONFLICT (codigo) DO NOTHING
         RETURNING id`,
        [nombre, codigo, passwordHash],
      );
      if (inserted.length > 0) {
        insertados++;
      } else {
        omitidos++;
      }
    }

    console.log(`  ${insertados} cuenta(s) nueva(s) insertada(s), ${omitidos} ya existían (omitidas).`);

    const cuentas = await qr.query(
      `SELECT nombre, codigo, rol, estado FROM usuarios
       WHERE codigo LIKE 'ALUMNO%'
       ORDER BY (regexp_replace(codigo, '\\D', '', 'g'))::int`,
    );
    console.log('\nCuentas ALUMNO en la base de datos:');
    console.table(cuentas);
  } finally {
    await qr.release();
    await ds.destroy();
  }
}

main().catch((err: unknown) => {
  console.error('Error ejecutando seed de alumnos:', err);
  process.exit(1);
});
