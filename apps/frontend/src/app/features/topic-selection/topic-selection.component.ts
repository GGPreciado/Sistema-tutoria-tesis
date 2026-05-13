import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { Tema } from '../../core/models/tema.model';

interface GrupoGrado {
  grado: number;
  temas: Tema[];
}

@Component({
  selector: 'app-topic-selection',
  standalone: true,
  templateUrl: './topic-selection.component.html',
  styleUrl: './topic-selection.component.css',
})
export class TopicSelectionComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly temas = signal<Tema[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly gruposPorGrado = computed<GrupoGrado[]>(() => {
    const mapa = new Map<number, Tema[]>();
    for (const tema of this.temas()) {
      const lista = mapa.get(tema.grado) ?? [];
      lista.push(tema);
      mapa.set(tema.grado, lista);
    }
    return Array.from(mapa.entries())
      .sort(([a], [b]) => a - b)
      .map(([grado, temas]) => ({ grado, temas }));
  });

  ngOnInit(): void {
    const cursoId = Number(this.route.snapshot.paramMap.get('cursoId'));
    this.api.getTemas(cursoId).subscribe({
      next: (temas) => {
        this.temas.set(temas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los temas. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  seleccionarTema(temaId: number): void {
    const cursoId = Number(this.route.snapshot.paramMap.get('cursoId'));
    this.router.navigate(['/evaluation', temaId], { state: { cursoId } });
  }

  volver(): void {
    this.router.navigate(['/courses']);
  }
}
