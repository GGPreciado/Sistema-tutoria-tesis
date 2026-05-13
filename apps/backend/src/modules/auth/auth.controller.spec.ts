import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { EstadoUsuario, RolUsuario } from '../../database/enums';
import { Usuario } from '../../database/entities/usuario.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController (integración)', () => {
  let app: INestApplication;

  const mockUsuario: Partial<Usuario> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    nombre: 'Valeria Torres Rojas',
    codigo: 'VAL001',
    password_hash: bcrypt.hashSync('pass1234', 10),
    rol: RolUsuario.ESTUDIANTE,
    estado: EstadoUsuario.ACTIVO,
  };

  const mockUsuarioRepo = {
    findOne: jest.fn().mockImplementation(({ where }: { where: { codigo?: string } }) => {
      if (where.codigo === 'VAL001') return Promise.resolve(mockUsuario);
      return Promise.resolve(null);
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: getRepositoryToken(Usuario), useValue: mockUsuarioRepo },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('credenciales correctas → 200 con usuario', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ codigo: 'VAL001', password: 'pass1234' })
        .expect(200);

      expect(res.body.usuario).toBeDefined();
      expect(res.body.usuario.id).toBe(mockUsuario.id);
      expect(res.body.usuario.codigo).toBe('VAL001');
      expect(res.body.usuario.nombre).toBe('Valeria Torres Rojas');
      expect(res.body.usuario.rol).toBe('estudiante');
      expect(res.body.usuario.password_hash).toBeUndefined();
    });

    it('contraseña incorrecta → 401 con formato de error', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ codigo: 'VAL001', password: 'wrongpassword' })
        .expect(401);

      expect(res.body.statusCode).toBe(401);
      expect(res.body.mensaje).toBeDefined();
      expect(res.body.error).toBe('Unauthorized');
    });

    it('usuario inexistente → 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ codigo: 'NOEXISTE', password: 'pass1234' })
        .expect(401);

      expect(res.body.statusCode).toBe(401);
    });

    it('body inválido (sin password) → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ codigo: 'VAL001' })
        .expect(400);

      expect(res.body.statusCode).toBe(400);
      expect(res.body.error).toBe('BadRequest');
    });
  });
});
