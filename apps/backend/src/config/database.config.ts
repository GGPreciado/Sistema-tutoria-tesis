import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Carga el .env relativo a la raíz del monorepo cuando se invoca el CLI de TypeORM
dotenv.config({ path: join(__dirname, '../../../../.env') });

// DataSource usado exclusivamente por el CLI de TypeORM
// (migration:run, migration:generate, migration:revert)
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'tutoria',
  entities: [join(__dirname, '../database/entities/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
  synchronize: false,
});

export default AppDataSource;
