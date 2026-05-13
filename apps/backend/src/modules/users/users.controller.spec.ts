import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { EstadoUsuario, RolUsuario } from '../../database/enums';
import { Usuario } from '../../database/entities/usuario.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PuntosCurso } from '../../database/entities/puntos-curso.entity';
import { UsuarioLogro } from '../../database/entities/usuario-logro.entity';

describe('UsersController (integración)', () => {
  let app: INestApplication;

  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const otroUserId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

  const mockUsuario: Partial<Usuario> = {
    id: userId,
    nombre: 'Valeria Torres Rojas',
    codigo: 'VAL001',
    rol: RolUsuario.ESTUDIANTE,
    estado: EstadoUsuario.ACTIVO,
  };

  const mockPerfil = {
    id: userId,
    nombre: 'Valeria Torres Rojas',
    codigo: 'VAL001',
    puntosTotal: 245,
    puntosPorCurso: [
      { cursoId: 1, cursoNombre: 'Matemática', puntosTotal: 245, posicion: 3 },
    ],
    logros: [],
  };

  const mockUsuarioRepo = {
    findOne: jest.fn().mockImplementation(({ where }: { where: { id?: string } }) => {
      if (where.id === userId) return Promise.resolve(mockUsuario);
      return Promise.resolve(null);
    }),
  };

  const mockUsersService = {
    getFullProfile: jest.fn().mockResolvedValue(mockPerfil),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: getRepositoryToken(Usuario), useValue: mockUsuarioRepo },
        { provide: getRepositoryToken(PuntosCurso), useValue: {} },
        { provide: getRepositoryToken(UsuarioLogro), useValue: {} },
        AuthGuard,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /students/me', () => {
    it('sin header X-User-Id → 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/students/me')
        .expect(401);

      expect(res.body.statusCode).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('X-User-Id inválido (usuario no existe) → 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/students/me')
        .set('X-User-Id', otroUserId)
        .expect(401);

      expect(res.body.statusCode).toBe(401);
    });

    it('X-User-Id válido → 200 con perfil completo', async () => {
      const res = await request(app.getHttpServer())
        .get('/students/me')
        .set('X-User-Id', userId)
        .expect(200);

      expect(res.body.id).toBe(userId);
      expect(res.body.codigo).toBe('VAL001');
      expect(res.body.puntosTotal).toBe(245);
      expect(Array.isArray(res.body.puntosPorCurso)).toBe(true);
      expect(Array.isArray(res.body.logros)).toBe(true);
    });

    it('respuesta no incluye password_hash', async () => {
      const res = await request(app.getHttpServer())
        .get('/students/me')
        .set('X-User-Id', userId)
        .expect(200);

      expect(res.body.password_hash).toBeUndefined();
    });
  });
});
