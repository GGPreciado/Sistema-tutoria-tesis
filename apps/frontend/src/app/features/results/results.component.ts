import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ResultadoEvaluacion } from '../../core/models/evaluacion.model';

@Component({
  selector: 'app-results',
  standalone: true,
  templateUrl: './results.component.html',
  styleUrl: './results.component.css',
})
export class ResultsComponent implements OnInit {
  private readonly router = inject(Router);

  readonly resultado = signal<ResultadoEvaluacion | null>(null);
  readonly mostrarLogros = signal(false);

  private cursoId = 0;

  ngOnInit(): void {
    const state = history.state as {
      resultado?: ResultadoEvaluacion;
      cursoId?: number;
    };

    if (!state?.resultado) {
      this.router.navigate(['/courses']);
      return;
    }

    this.resultado.set(state.resultado);
    this.cursoId = state.cursoId ?? 0;

    // Revela los logros con un breve delay para que el estudiante los note
    if ((state.resultado.logrosDesbloqueados?.length ?? 0) > 0) {
      setTimeout(() => this.mostrarLogros.set(true), 500);
    }
  }

  etiquetaAccion(accion: 'subir' | 'mantener' | 'bajar'): string {
    const etiquetas: Record<string, string> = {
      subir: 'Ejercicios más avanzados',
      mantener: 'Continuar en el nivel actual',
      bajar: 'Repasar contenidos anteriores',
    };
    return etiquetas[accion] ?? accion;
  }

  etiquetaDificultad(dificultad: 'facil' | 'normal' | 'dificil'): string {
    const etiquetas: Record<string, string> = {
      facil: 'Fácil',
      normal: 'Normal',
      dificil: 'Difícil',
    };
    return etiquetas[dificultad] ?? dificultad;
  }

  claseNota(nota: number): string {
    if (nota >= 80) return 'nota-alta';
    if (nota >= 60) return 'nota-media';
    return 'nota-baja';
  }

  volverATemas(): void {
    if (this.cursoId) {
      this.router.navigate(['/courses', this.cursoId, 'topics']);
    } else {
      this.router.navigate(['/courses']);
    }
  }
}
