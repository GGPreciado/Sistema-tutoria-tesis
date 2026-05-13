import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { Curso } from '../../core/models/curso.model';

const ICONOS_CURSOS: Record<string, string> = {
  'Matemática': '🔢',
  'Comunicación': '📖',
  'Ciencias': '🔬',
  'Historia': '🏛️',
  'Arte': '🎨',
};

@Component({
  selector: 'app-course-selection',
  standalone: true,
  templateUrl: './course-selection.component.html',
  styleUrl: './course-selection.component.css',
})
export class CourseSelectionComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly cursos = signal<Curso[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.getCursos().subscribe({
      next: (cursos) => {
        this.cursos.set(cursos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los cursos. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  iconoCurso(nombre: string): string {
    return ICONOS_CURSOS[nombre] ?? '📚';
  }

  seleccionarCurso(cursoId: number): void {
    this.router.navigate(['/courses', cursoId, 'topics']);
  }
}
