import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import {
  Evaluacion,
  RespuestaEnvio,
} from '../../core/models/evaluacion.model';

@Component({
  selector: 'app-evaluation',
  standalone: true,
  templateUrl: './evaluation.component.html',
  styleUrl: './evaluation.component.css',
})
export class EvaluationComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly cargando = signal(true);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly evaluacion = signal<Evaluacion | null>(null);

  // preguntaId → opcionId elegida
  readonly selecciones = signal<Record<number, number>>({});

  private cursoId = 0;
  private tiempoInicio = 0;
  private ultimoEventoMs = 0;
  // Tiempos individuales por pregunta (delta desde el evento anterior)
  private readonly tiemposSeleccion = new Map<number, number>();

  readonly todasRespondidas = computed(() => {
    const ev = this.evaluacion();
    if (!ev) return false;
    const sel = this.selecciones();
    return ev.preguntas.every((p) => sel[p.id] !== undefined);
  });

  readonly progreso = computed(() => {
    const ev = this.evaluacion();
    if (!ev) return 0;
    const sel = this.selecciones();
    return ev.preguntas.filter((p) => sel[p.id] !== undefined).length;
  });

  ngOnInit(): void {
    const temaId = Number(this.route.snapshot.paramMap.get('temaId'));
    this.cursoId = (history.state as { cursoId?: number }).cursoId ?? 0;

    this.api.iniciarEvaluacion(temaId).subscribe({
      next: (ev) => {
        this.evaluacion.set(ev);
        this.cargando.set(false);
        this.tiempoInicio = Date.now();
        this.ultimoEventoMs = Date.now();
      },
      error: () => {
        this.error.set('No se pudo cargar la evaluación. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  seleccionarOpcion(preguntaId: number, opcionId: number): void {
    const ahora = Date.now();
    // Delta en segundos desde el último evento (primer click o cambio)
    const delta = Math.max(1, Math.round((ahora - this.ultimoEventoMs) / 1000));
    this.tiemposSeleccion.set(preguntaId, delta);
    this.ultimoEventoMs = ahora;
    this.selecciones.update((sel) => ({ ...sel, [preguntaId]: opcionId }));
  }

  estaSeleccionada(preguntaId: number, opcionId: number): boolean {
    return this.selecciones()[preguntaId] === opcionId;
  }

  estaRespondida(preguntaId: number): boolean {
    return this.selecciones()[preguntaId] !== undefined;
  }

  finalizarEvaluacion(): void {
    const ev = this.evaluacion();
    if (!ev || !this.todasRespondidas()) return;

    const tiempoTotal = Math.round((Date.now() - this.tiempoInicio) / 1000);
    const tiempoPorDefecto = Math.max(
      1,
      Math.round(tiempoTotal / ev.preguntas.length),
    );

    const respuestas: RespuestaEnvio[] = ev.preguntas.map((p) => ({
      preguntaId: p.id,
      opcionId: this.selecciones()[p.id],
      tiempoRespuestaSeg:
        this.tiemposSeleccion.get(p.id) ?? tiempoPorDefecto,
    }));

    this.enviando.set(true);
    this.api.finalizarEvaluacion(ev.evaluacionId, respuestas).subscribe({
      next: (resultado) => {
        this.router.navigate(['/results'], {
          state: { resultado, cursoId: this.cursoId },
        });
      },
      error: () => {
        this.error.set('Error al enviar la evaluación. Intenta de nuevo.');
        this.enviando.set(false);
      },
    });
  }

  volver(): void {
    if (this.cursoId) {
      this.router.navigate(['/courses', this.cursoId, 'topics']);
    } else {
      this.router.navigate(['/courses']);
    }
  }
}
