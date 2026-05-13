import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';

@Module({
  imports: [
    // Carga las variables de entorno del .env en process.env
    ConfigModule.forRoot({ isGlobal: true }),

    // Conexión a PostgreSQL vía variables de entorno
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'tutoria'),
        // Las entidades se registran en cada módulo con TypeOrmModule.forFeature()
        autoLoadEntities: true,
        // synchronize: false — siempre usar migrations explícitas
        synchronize: false,
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
      }),
    }),

    // Módulos de features — se agregan aquí a medida que se implementan
    HealthModule,
    AuthModule,
    UsersModule,
    CoursesModule,
  ],
})
export class AppModule {}
