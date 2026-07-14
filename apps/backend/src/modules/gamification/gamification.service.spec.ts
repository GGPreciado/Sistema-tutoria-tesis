import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Evaluacion } from '../../database/entities/evaluacion.entity';
import { Logro } from '../../database/entities/logro.entity';
import { PuntosCurso } from '../../database/entities/puntos-curso.entity';
import { TiempoUsuario } from '../../database/entities/tiempo-usuario.entity';
import { UsuarioLogro } from '../../database/entities/usuario-logro.entity';
import { NivelDificultad } from '../../database/enums';
import { GamificationService } from './gamification.service';

// Catálogo mínimo de logros para los tests
const LOGROS_CATALOGO: Partial<Logro>[] = [
  { id: 'logro-primer-examen', nombre: 'Iniciaste tu camino', descripcion: 'Completaste tu primera evaluación.', criterio: 'primer_examen' },
  { id: 'logro-examen-perfecto', nombre: 'Examen perfecto', descripcion: 'Obtuviste todas las respuestas correctas.', criterio: 'examen_perfecto' },
  { id: 'logro-velocista', nombre: 'Velocista', descripcion: 'Completaste una evaluación con tiempo promedio < 20 s.', criterio: 'velocista' },
  { id: 'logro-racha-5', nombre: 'Racha de 5', descripcion: 'Lograste 5 respuestas correctas seguidas.', criterio: 'racha_5' },
  { id: 'logro-racha-10', nombre: 'Imparable', descripcion: 'Lograste 10 respuestas correctas seguidas.', criterio: 'racha_10' },
  { id: 'logro-nivel-avanzado', nombre: 'Nivel avanzado', descripcion: "Alcanzaste la dificultad 'difícil'.", criterio: 'nivel_avanzado' },
  { id: 'logro-constancia-5', nombre: 'Constancia', descripcion: 'Completaste 5 evaluaciones.', criterio: 'constancia_5' },
  { id: 'logro-dedicado-10', nombre: 'Dedicado', descripcion: 'Completaste 10 evaluaciones.', criterio: 'dedicado_10' },
];

const USUARIO_ID = 'usuario-uuid-1';
const EVALUACION_ID = 'eval-uuid-1';
const CURSO_ID = 1;

describe('GamificationService', () => {
  let service: GamificationService;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
  };

  const mockPuntosCursoRepo = {
    findOne: jest.fn(),
    create: jest.fn((dto: Partial<PuntosCurso>) => ({ ...dto })),
    save: jest.fn((entity: PuntosCurso) => Promise.resolve(entity)),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockLogroRepo = {
    find: jest.fn().mockResolvedValue(LOGROS_CATALOGO),
  };

  const mockUsuarioLogroRepo = {
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn((dto: Partial<UsuarioLogro>) => ({ ...dto })),
    save: jest.fn((entities: UsuarioLogro[]) => Promise.resolve(entities)),
  };

  const mockEvaluacionRepo = {
    count: jest.fn(),
  };

  const mockTiempoUsuarioRepo = {
    findOne: jest.fn(),
    create: jest.fn((dto: Partial<TiempoUsuario>) => ({ ...dto })),
    save: jest.fn((entity: TiempoUsuario) => Promise.resolve(entity)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: getRepositoryToken(PuntosCurso), useValue: mockPuntosCursoRepo },
        { provide: getRepositoryToken(Logro), useValue: mockLogroRepo },
        { provide: getRepositoryToken(UsuarioLogro), useValue: mockUsuarioLogroRepo },
        { provide: getRepositoryToken(Evaluacion), useValue: mockEvaluacionRepo },
        { provide: getRepositoryToken(TiempoUsuario), useValue: mockTiempoUsuarioRepo },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
    jest.clearAllMocks();

    // Restaurar mocks que necesitan comportamiento por defecto
    mockLogroRepo.find.mockResolvedValue(LOGROS_CATALOGO);
    mockUsuarioLogroRepo.find.mockResolvedValue([]);
    mockUsuarioLogroRepo.create.mockImplementation((dto: Partial<UsuarioLogro>) => ({ ...dto }));
    mockUsuarioLogroRepo.save.mockImplementation((entities: UsuarioLogro[]) =>
      Promise.resolve(entities),
    );
    mockPuntosCursoRepo.create.mockImplementation((dto: Partial<PuntosCurso>) => ({ ...dto }));
    mockPuntosCursoRepo.save.mockImplementation((entity: PuntosCurso) => Promise.resolve(entity));
    mockTiempoUsuarioRepo.create.mockImplementation((dto: Partial<TiempoUsuario>) => ({ ...dto }));
    mockTiempoUsuarioRepo.save.mockImplementation((entity: TiempoUsuario) =>
      Promise.resolve(entity),
    );
    mockQueryBuilder.where.mockReturnThis();
    mockQueryBuilder.andWhere.mockReturnThis();
    mockQueryBuilder.getCount.mockResolvedValue(0);
    mockPuntosCursoRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  // ─── verificarLogros ──────────────────────────────────────────────────────

  describe('verificarLogros', () => {
    it('primera evaluación con nota 100 → desbloquea primer_examen Y examen_perfecto', async () => {
      mockEvaluacionRepo.count.mockResolvedValue(1);
      mockUsuarioLogroRepo.find.mockResolvedValue([]);

      const logros = await service.verificarLogros(USUARIO_ID, EVALUACION_ID, {
        nota: 100,
        tiempoPromedioRespuesta: 30,
        numAciertosConsecutivos: 3,
        dificultadActual: NivelDificultad.NORMAL,
      });

      const criterios = logros.map((l) => {
        const match = LOGROS_CATALOGO.find((c) => c.id === l.id);
        return match?.criterio;
      });

      expect(criterios).toContain('primer_examen');
      expect(criterios).toContain('examen_perfecto');
      expect(mockUsuarioLogroRepo.save).toHaveBeenCalledTimes(1);
    });

    it('segunda evaluación → NO vuelve a desbloquear primer_examen', async () => {
      mockEvaluacionRepo.count.mockResolvedValue(2);
      // primer_examen ya desbloqueado en la primera evaluación
      mockUsuarioLogroRepo.find.mockResolvedValue([{ logro_id: 'logro-primer-examen' }]);

      const logros = await service.verificarLogros(USUARIO_ID, EVALUACION_ID, {
        nota: 60,
        tiempoPromedioRespuesta: 30,
        numAciertosConsecutivos: 2,
        dificultadActual: NivelDificultad.NORMAL,
      });

      const criterios = logros.map((l) => {
        const match = LOGROS_CATALOGO.find((c) => c.id === l.id);
        return match?.criterio;
      });

      expect(criterios).not.toContain('primer_examen');
    });

    it('racha de 5 aciertos → desbloquea racha_5', async () => {
      mockEvaluacionRepo.count.mockResolvedValue(1);
      mockUsuarioLogroRepo.find.mockResolvedValue([]);

      const logros = await service.verificarLogros(USUARIO_ID, EVALUACION_ID, {
        nota: 50,
        tiempoPromedioRespuesta: 30,
        numAciertosConsecutivos: 5,
        dificultadActual: NivelDificultad.NORMAL,
      });

      const criterios = logros.map((l) => {
        const match = LOGROS_CATALOGO.find((c) => c.id === l.id);
        return match?.criterio;
      });

      expect(criterios).toContain('racha_5');
      expect(criterios).not.toContain('racha_10');
    });

    it('logro ya desbloqueado no se duplica en usuario_logros', async () => {
      mockEvaluacionRepo.count.mockResolvedValue(1);
      // Ambos logros ya existen
      mockUsuarioLogroRepo.find.mockResolvedValue([
        { logro_id: 'logro-primer-examen' },
        { logro_id: 'logro-examen-perfecto' },
      ]);

      const logros = await service.verificarLogros(USUARIO_ID, EVALUACION_ID, {
        nota: 100,
        tiempoPromedioRespuesta: 30,
        numAciertosConsecutivos: 3,
        dificultadActual: NivelDificultad.NORMAL,
      });

      expect(logros).toHaveLength(0);
      expect(mockUsuarioLogroRepo.save).not.toHaveBeenCalled();
    });
  });

  // ─── asignarPuntos ────────────────────────────────────────────────────────

  describe('asignarPuntos', () => {
    it('crea una nueva fila si el usuario no tiene puntos en el curso', async () => {
      mockPuntosCursoRepo.findOne.mockResolvedValue(null);
      mockQueryBuilder.getCount.mockResolvedValue(2); // 2 usuarios con más puntos → posición 3

      const ranking = await service.asignarPuntos(USUARIO_ID, CURSO_ID, 50);

      expect(mockPuntosCursoRepo.create).toHaveBeenCalled();
      expect(ranking.puntosTotal).toBe(50);
      expect(ranking.posicion).toBe(3);
      expect(ranking.cursoId).toBe(CURSO_ID);
    });

    it('suma puntos si el usuario ya tiene fila existente', async () => {
      const existente = { usuario_id: USUARIO_ID, curso_id: CURSO_ID, puntos_total: 100, posicion: 1 };
      mockPuntosCursoRepo.findOne.mockResolvedValue(existente);
      mockQueryBuilder.getCount.mockResolvedValue(0);

      const ranking = await service.asignarPuntos(USUARIO_ID, CURSO_ID, 50);

      expect(ranking.puntosTotal).toBe(150);
      expect(ranking.posicion).toBe(1);
    });
  });

  // ─── registrarTiempo ──────────────────────────────────────────────────────

  describe('registrarTiempo', () => {
    it('crea una nueva fila si el usuario no tiene tiempo registrado', async () => {
      mockTiempoUsuarioRepo.findOne.mockResolvedValue(null);

      const total = await service.registrarTiempo(USUARIO_ID, 120);

      expect(mockTiempoUsuarioRepo.create).toHaveBeenCalledWith({
        usuario_id: USUARIO_ID,
        segundos_totales: 120,
      });
      expect(total).toBe(120);
    });

    it('suma segundos si el usuario ya tiene fila existente', async () => {
      const existente = { usuario_id: USUARIO_ID, segundos_totales: 300 };
      mockTiempoUsuarioRepo.findOne.mockResolvedValue(existente);

      const total = await service.registrarTiempo(USUARIO_ID, 90);

      expect(total).toBe(390);
    });
  });
});
