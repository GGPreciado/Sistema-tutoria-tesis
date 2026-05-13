import { INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { EstadoUsuario, RolUsuario } from '../../database/enums';
import { Usuario } from '../../database/entities/usuario.entity';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { AuthGuard } from '../../common/guards/auth.guard';

describe('CoursesController (integración)', () => {
  let app: INestApplication;

  const userId = '123e4567-e89b-12d3-a456-426614174000';

  const mockUsuario: Partial<Usuario> = {
    id: userId,
    nombre: 'Valeria Torres Rojas',
    codigo: 'VAL001',
    rol: RolUsuario.ESTUDIANTE,
    estado: EstadoUsuario.ACTIVO,
  };

  const mockCursos = [{ id: 1, nombre: 'Matemática' }];

  const mockTemas = [
    { id: 1, nombre: 'Fracciones equivalentes', grado: 4 },
    { id: 2, nombre: 'Multiplicación de naturales', grado: 4 },
    { id: 3, nombre: 'Suma y resta de fracciones', grado: 5 },
    { id: 4, nombre: 'Operaciones con decimales', grado: 5 },
  ];

  const mockCoursesService = {
    findAll: jest.fn().mockResolvedValue(mockCursos),
    findTopicsByCourse: jest.fn().mockImplementation((cursoId: number) => {
      if (cursoId === 1) return Promise.resolve(mockTemas);
      return Promise.reject(new NotFoundException(`Curso con id ${cursoId} no encontrado`));
    }),
  };

  const mockUsuarioRepo = {
    findOne: jest.fn().mockImplementation(({ where }: { where: { id?: string } }) => {
      if (where.id === userId) return Promise.resolve(mockUsuario);
      return Promise.resolve(null);
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        { provide: CoursesService, useValue: mockCoursesService },
        { provide: getRepositoryToken(Usuario), useValue: mockUsuarioRepo },
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

  describe('GET /courses', () => {
    it('sin header X-User-Id → 401', async () => {
      const res = await request(app.getHttpServer()).get('/courses').expect(401);
      expect(res.body.statusCode).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('con X-User-Id válido → 200 con array de cursos', async () => {
      const res = await request(app.getHttpServer())
        .get('/courses')
        .set('X-User-Id', userId)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toMatchObject({ id: 1, nombre: 'Matemática' });
    });
  });

  describe('GET /courses/:cursoId/topics', () => {
    it('sin header X-User-Id → 401', async () => {
      const res = await request(app.getHttpServer()).get('/courses/1/topics').expect(401);
      expect(res.body.statusCode).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('curso 1 → 200 con 4 temas', async () => {
      const res = await request(app.getHttpServer())
        .get('/courses/1/topics')
        .set('X-User-Id', userId)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(4);
      expect(res.body[0]).toMatchObject({ id: 1, nombre: 'Fracciones equivalentes', grado: 4 });
    });

    it('curso 999 → 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/courses/999/topics')
        .set('X-User-Id', userId)
        .expect(404);
      expect(res.body.statusCode).toBe(404);
      expect(res.body.error).toBe('NotFound');
    });
  });
});
