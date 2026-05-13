import {
  ConflictException,
  ForbiddenException,
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { AuthGuard } from '../../common/guards/auth.guard';
import { EstadoUsuario, NivelDificultad, RolUsuario } from '../../database/enums';
import { Usuario } from '../../database/entities/usuario.entity';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';

describe('EvaluationsController (integración)', () => {
  let app: INestApplication;

  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const evalId = '456e7890-e89b-12d3-a456-426614174111';

  const mockUsuario: Partial<Usuario> = {
    id: userId,
    nombre: 'Valeria Torres Rojas',
    codigo: 'VAL001',
    rol: RolUsuario.ESTUDIANTE,
    estado: EstadoUsuario.ACTIVO,
  };

  // 8 preguntas mínimas para la respuesta de crear
  const mockPreguntas = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    enunciado: `Pregunta ${i + 1}`,
    opciones: [
      { id: i * 4 + 1, texto: 'Opción A' },
      { id: i * 4 + 2, texto: 'Opción B' },
      { id: i * 4 + 3, texto: 'Opción C' },
      { id: i * 4 + 4, texto: 'Opción D' },
    ],
  }));

  const mockResultado = {
    nota: 100,
    numAciertos: 8,
    numErrores: 0,
    numAciertosConsecutivos: 8,
    numErroresConsecutivos: 0,
    tiempoPromedioRespuesta: 20,
    indiceDesempeno: 0.7,
    dificultadActual: NivelDificultad.DIFICIL,
    accionAdaptativa: 'subir',
    mensajeAdaptativo: '¡Excelente trabajo! Avanzamos al siguiente nivel de dificultad.',
    puntosGanados: 100,
    logrosDesbloqueados: [],
    rankingActualizado: null,
  };

  const mockEvaluationsService = {
    crear: jest.fn(),
    finalizar: jest.fn(),
  };

  const mockUsuarioRepo = {
    findOne: jest.fn().mockImplementation(({ where }: { where: { id?: string } }) => {
      if (where.id === userId) return Promise.resolve(mockUsuario);
      return Promise.resolve(null);
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EvaluationsController],
      providers: [
        { provide: EvaluationsService, useValue: mockEvaluationsService },
        { provide: getRepositoryToken(Usuario), useValue: mockUsuarioRepo },
        AuthGuard,
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

  beforeEach(() => {
    jest.clearAllMocks();
    // Restaurar mock del usuario después de clearAllMocks
    mockUsuarioRepo.findOne.mockImplementation(({ where }: { where: { id?: string } }) => {
      if (where.id === userId) return Promise.resolve(mockUsuario);
      return Promise.resolve(null);
    });
  });

  // ─── POST /evaluations ────────────────────────────────────────────────────

  describe('POST /evaluations', () => {
    it('sin header X-User-Id → 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/evaluations')
        .send({ temaId: 1 })
        .expect(401);
      expect(res.body.statusCode).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('body sin temaId → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/evaluations')
        .set('X-User-Id', userId)
        .send({})
        .expect(400);
      expect(res.body.statusCode).toBe(400);
    });

    it('temaId no entero → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/evaluations')
        .set('X-User-Id', userId)
        .send({ temaId: 'abc' })
        .expect(400);
      expect(res.body.statusCode).toBe(400);
    });

    it('temaId válido → 201 con evaluacionId y preguntas', async () => {
      mockEvaluationsService.crear.mockResolvedValueOnce({
        evaluacionId: evalId,
        temaId: 1,
        temaNombre: 'Fracciones equivalentes',
        preguntas: mockPreguntas,
      });

      const res = await request(app.getHttpServer())
        .post('/evaluations')
        .set('X-User-Id', userId)
        .send({ temaId: 1 })
        .expect(201);

      expect(res.body.evaluacionId).toBe(evalId);
      expect(res.body.temaId).toBe(1);
      expect(Array.isArray(res.body.preguntas)).toBe(true);
      expect(res.body.preguntas).toHaveLength(8);
      // Las opciones no deben exponer es_correcta
      expect(res.body.preguntas[0].opciones[0]).not.toHaveProperty('es_correcta');
    });

    it('tema no encontrado → 404', async () => {
      mockEvaluationsService.crear.mockRejectedValueOnce(
        new NotFoundException('Tema con id 999 no encontrado'),
      );

      const res = await request(app.getHttpServer())
        .post('/evaluations')
        .set('X-User-Id', userId)
        .send({ temaId: 999 })
        .expect(404);

      expect(res.body.statusCode).toBe(404);
      expect(res.body.error).toBe('NotFound');
    });
  });

  // ─── POST /evaluations/:id/finalize ───────────────────────────────────────

  describe('POST /evaluations/:id/finalize', () => {
    const respuestasValidas = {
      respuestas: Array.from({ length: 8 }, (_, i) => ({
        preguntaId: i + 1,
        opcionId: i * 4 + 1,
        tiempoRespuestaSeg: 20,
      })),
    };

    it('sin header X-User-Id → 401', async () => {
      const res = await request(app.getHttpServer())
        .post(`/evaluations/${evalId}/finalize`)
        .send(respuestasValidas)
        .expect(401);
      expect(res.body.statusCode).toBe(401);
    });

    it('uuid inválido → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/evaluations/no-es-uuid/finalize')
        .set('X-User-Id', userId)
        .send(respuestasValidas)
        .expect(400);
      expect(res.body.statusCode).toBe(400);
    });

    it('respuestas correctas → 200 con resultado completo', async () => {
      mockEvaluationsService.finalizar.mockResolvedValueOnce(mockResultado);

      const res = await request(app.getHttpServer())
        .post(`/evaluations/${evalId}/finalize`)
        .set('X-User-Id', userId)
        .send(respuestasValidas)
        .expect(200);

      expect(res.body.nota).toBe(100);
      expect(res.body.numAciertos).toBe(8);
      expect(typeof res.body.indiceDesempeno).toBe('number');
      expect(['subir', 'mantener', 'bajar']).toContain(res.body.accionAdaptativa);
      expect(Object.values(NivelDificultad)).toContain(res.body.dificultadActual);
    });

    it('evaluación no pertenece al usuario → 403', async () => {
      mockEvaluationsService.finalizar.mockRejectedValueOnce(
        new ForbiddenException('Evaluación no pertenece al usuario autenticado'),
      );

      const res = await request(app.getHttpServer())
        .post(`/evaluations/${evalId}/finalize`)
        .set('X-User-Id', userId)
        .send(respuestasValidas)
        .expect(403);

      expect(res.body.statusCode).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('evaluación ya finalizada → segundo intento devuelve 409', async () => {
      // Primera llamada exitosa
      mockEvaluationsService.finalizar
        .mockResolvedValueOnce(mockResultado)
        .mockRejectedValueOnce(new ConflictException('La evaluación ya fue finalizada'));

      await request(app.getHttpServer())
        .post(`/evaluations/${evalId}/finalize`)
        .set('X-User-Id', userId)
        .send(respuestasValidas)
        .expect(200);

      const res = await request(app.getHttpServer())
        .post(`/evaluations/${evalId}/finalize`)
        .set('X-User-Id', userId)
        .send(respuestasValidas)
        .expect(409);

      expect(res.body.statusCode).toBe(409);
      expect(res.body.error).toBe('Conflict');
    });
  });
});
