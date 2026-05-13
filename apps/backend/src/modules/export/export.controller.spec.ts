import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { AuthGuard } from '../../common/guards/auth.guard';
import { EstadoUsuario, RolUsuario } from '../../database/enums';
import { Usuario } from '../../database/entities/usuario.entity';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

describe('ExportController (integración)', () => {
  let app: INestApplication;

  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const ADMIN_TOKEN = 'token-secreto-test';

  const CSV_CABECERA =
    'usuario_id,usuario_codigo,usuario_nombre,evaluacion_id,curso,tema,grado,' +
    'creado_en,finalizado_en,nota,num_aciertos,num_errores,' +
    'num_aciertos_consecutivos,num_errores_consecutivos,' +
    'tiempo_promedio_respuesta,indice_desempeno,dificultad_actual,' +
    'accion_adaptativa,puntaje_logro';

  const CSV_FILA =
    `${userId},VAL001,Valeria Torres Rojas,eval-uuid,Matemática,Fracciones equivalentes,4,` +
    `2026-05-12T14:00:00.000Z,2026-05-12T14:08:00.000Z,85,8,2,5,1,28,0.720,dificil,subir,100`;

  const mockExportService = {
    generarCsv: jest.fn(),
  };

  const mockUsuario: Partial<Usuario> = {
    id: userId,
    nombre: 'Valeria Torres Rojas',
    codigo: 'VAL001',
    rol: RolUsuario.ESTUDIANTE,
    estado: EstadoUsuario.ACTIVO,
  };

  const mockUsuarioRepo = {
    findOne: jest.fn().mockImplementation(({ where }: { where: { id?: string } }) => {
      if (where.id === userId) return Promise.resolve(mockUsuario);
      return Promise.resolve(null);
    }),
  };

  beforeAll(async () => {
    process.env['ADMIN_EXPORT_TOKEN'] = ADMIN_TOKEN;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ExportController],
      providers: [
        { provide: ExportService, useValue: mockExportService },
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
    delete process.env['ADMIN_EXPORT_TOKEN'];
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsuarioRepo.findOne.mockImplementation(({ where }: { where: { id?: string } }) => {
      if (where.id === userId) return Promise.resolve(mockUsuario);
      return Promise.resolve(null);
    });
  });

  // ─── GET /admin/export ────────────────────────────────────────────────────

  describe('GET /admin/export', () => {
    it('sin X-User-Id → 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/export')
        .set('X-Admin-Token', ADMIN_TOKEN)
        .expect(401);
      expect(res.body.statusCode).toBe(401);
    });

    it('sin X-Admin-Token → 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/export')
        .set('X-User-Id', userId)
        .expect(403);
      expect(res.body.statusCode).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('X-Admin-Token incorrecto → 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/export')
        .set('X-User-Id', userId)
        .set('X-Admin-Token', 'token-malo')
        .expect(403);
      expect(res.body.statusCode).toBe(403);
    });

    it('token correcto → 200 con CSV y cabecera correcta', async () => {
      const csvCompleto = [CSV_CABECERA, CSV_FILA].join('\r\n');
      mockExportService.generarCsv.mockResolvedValueOnce(csvCompleto);

      const res = await request(app.getHttpServer())
        .get('/admin/export')
        .set('X-User-Id', userId)
        .set('X-Admin-Token', ADMIN_TOKEN)
        .expect(200);

      expect(res.headers['content-type']).toMatch(/text\/csv/);
      const lineas = (res.text as string).split('\r\n');
      expect(lineas[0]).toBe(CSV_CABECERA);
      expect(lineas).toHaveLength(2);
    });

    it('token correcto con datos → CSV tiene todas las columnas', async () => {
      const csvCompleto = [CSV_CABECERA, CSV_FILA].join('\r\n');
      mockExportService.generarCsv.mockResolvedValueOnce(csvCompleto);

      const res = await request(app.getHttpServer())
        .get('/admin/export')
        .set('X-User-Id', userId)
        .set('X-Admin-Token', ADMIN_TOKEN)
        .expect(200);

      const columnas = (res.text as string).split('\r\n')[0].split(',');
      expect(columnas).toContain('usuario_id');
      expect(columnas).toContain('nota');
      expect(columnas).toContain('indice_desempeno');
      expect(columnas).toContain('accion_adaptativa');
      expect(columnas).toContain('puntaje_logro');
      expect(columnas).toHaveLength(19);
    });

    it('filtro de fechas se pasa al service', async () => {
      mockExportService.generarCsv.mockResolvedValueOnce(CSV_CABECERA);

      await request(app.getHttpServer())
        .get('/admin/export?desde=2026-05-01&hasta=2026-05-31')
        .set('X-User-Id', userId)
        .set('X-Admin-Token', ADMIN_TOKEN)
        .expect(200);

      expect(mockExportService.generarCsv).toHaveBeenCalledWith({
        desde: '2026-05-01',
        hasta: '2026-05-31',
      });
    });
  });
});
