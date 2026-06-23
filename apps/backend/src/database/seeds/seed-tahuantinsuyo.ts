import 'reflect-metadata';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: path.join(__dirname, '../../../../../.env') });

interface OpcionSeed {
  texto: string;
  es_correcta: boolean;
}

interface PreguntaSeed {
  id_local: string;
  tema_local: string;
  tipo: string;
  dificultad: string;
  enunciado: string;
  opciones: OpcionSeed[];
}

interface TahuantinsuyoData {
  cursos: { id_local: string; nombre: string }[];
  temas: { id_local: string; curso_local: string; nombre: string; grado: number }[];
  preguntas: PreguntaSeed[];
}

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
    const seedsPath = path.join(__dirname, '../../../../../docs/seeds-tahuantinsuyo.json');
    const data: TahuantinsuyoData = JSON.parse(fs.readFileSync(seedsPath, 'utf-8'));

    // --- 1. Cursos ---
    console.log('Insertando cursos...');
    const cursoIdMap = new Map<string, number>();
    for (const curso of data.cursos) {
      const inserted = await qr.query(
        `INSERT INTO cursos (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING RETURNING id`,
        [curso.nombre],
      );
      if (inserted.length > 0) {
        cursoIdMap.set(curso.id_local, inserted[0].id as number);
      } else {
        const rows = await qr.query(`SELECT id FROM cursos WHERE nombre = $1`, [curso.nombre]);
        cursoIdMap.set(curso.id_local, rows[0].id as number);
      }
    }
    console.log(`  ${cursoIdMap.size} curso(s) procesado(s).`);

    // --- 2. Temas ---
    console.log('Insertando temas...');
    const temaIdMap = new Map<string, number>();
    const temaACursoId = new Map<string, number>();
    for (const tema of data.temas) {
      const cursoId = cursoIdMap.get(tema.curso_local)!;
      const inserted = await qr.query(
        `INSERT INTO temas (nombre, curso_id, grado)
         VALUES ($1, $2, $3)
         ON CONFLICT (curso_id, grado, nombre) DO NOTHING
         RETURNING id`,
        [tema.nombre, cursoId, tema.grado],
      );
      if (inserted.length > 0) {
        temaIdMap.set(tema.id_local, inserted[0].id as number);
      } else {
        const rows = await qr.query(
          `SELECT id FROM temas WHERE nombre = $1 AND curso_id = $2 AND grado = $3`,
          [tema.nombre, cursoId, tema.grado],
        );
        temaIdMap.set(tema.id_local, rows[0].id as number);
      }
      temaACursoId.set(tema.id_local, cursoId);
    }
    console.log(`  ${temaIdMap.size} tema(s) procesado(s).`);

    // --- 3. Preguntas y opciones ---
    console.log('Insertando preguntas y opciones...');
    let insertadas = 0;
    let omitidas = 0;
    for (const pregunta of data.preguntas) {
      const temaId = temaIdMap.get(pregunta.tema_local)!;
      const cursoId = temaACursoId.get(pregunta.tema_local)!;

      const existing = await qr.query(
        `SELECT id FROM preguntas WHERE enunciado = $1 AND tema_id = $2`,
        [pregunta.enunciado, temaId],
      );

      if (existing.length === 0) {
        const pregResult = await qr.query(
          `INSERT INTO preguntas (enunciado, tipo, tema_id, curso_id, dificultad)
           VALUES ($1, $2::tipo_pregunta, $3, $4, $5::nivel_dificultad)
           RETURNING id`,
          [pregunta.enunciado, pregunta.tipo, temaId, cursoId, pregunta.dificultad],
        );
        const preguntaId = pregResult[0].id as number;
        for (const opcion of pregunta.opciones) {
          await qr.query(
            `INSERT INTO opciones (pregunta_id, texto, es_correcta) VALUES ($1, $2, $3)`,
            [preguntaId, opcion.texto, opcion.es_correcta],
          );
        }
        insertadas++;
      } else {
        omitidas++;
      }
    }
    console.log(`  ${insertadas} pregunta(s) nueva(s) insertada(s), ${omitidas} ya existían (omitidas).`);

    // --- Resumen final ---
    const [counts] = await qr.query(`
      SELECT
        (SELECT count(*)::int FROM cursos)    AS cursos,
        (SELECT count(*)::int FROM temas)     AS temas,
        (SELECT count(*)::int FROM preguntas) AS preguntas,
        (SELECT count(*)::int FROM opciones)  AS opciones
    `);
    console.log('\nConteo total de filas por tabla:');
    console.table(counts);

    const porNivel = await qr.query(`
      SELECT dificultad, count(*)::int AS total
      FROM preguntas
      WHERE tema_id = $1
      GROUP BY dificultad
      ORDER BY dificultad
    `, [temaIdMap.get('tahuantinsuyo')]);
    console.log('\nPreguntas del Tahuantinsuyo por nivel de dificultad:');
    console.table(porNivel);

  } finally {
    await qr.release();
    await ds.destroy();
  }
}

main().catch((err: unknown) => {
  console.error('Error ejecutando seed:', err);
  process.exit(1);
});
