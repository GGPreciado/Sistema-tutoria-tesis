import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Carga el .env relativo a la raíz del monorepo cuando se invoca el CLI de TypeORM
dotenv.config({ path: join(__dirname, '../../../../.env') });

const databaseUrl = process.env.DATABASE_URL;

const AppDataSource = new DataSource(
  databaseUrl
    ? {
        type: 'postgres',
        url: databaseUrl,
        ssl: { rejectUnauthorized: false },
        entities: [join(__dirname, '../database/entities/*.entity{.ts,.js}')],
        migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
        synchronize: false,
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USER ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_NAME ?? 'tutoria',
        entities: [join(__dirname, '../database/entities/*.entity{.ts,.js}')],
        migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
        synchronize: false,
      }
);

export default AppDataSource;
