import { Component } from '@angular/core';

// Placeholder — se implementa en el Paso 10 del sprint-mvp.md.
// Redirigirá a #/courses. Aquí también se mostrará el resumen rápido
// del progreso del estudiante.
@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div class="home-placeholder">
      <h1>¡Bienvenido al Sistema de Tutoría!</h1>
      <p>Esta pantalla se implementa en el Paso 10.</p>
      <p>Mostrará la selección de cursos disponibles.</p>
    </div>
  `,
  styles: [
    `
      .home-placeholder {
        text-align: center;
        padding: 4rem 2rem;
      }
      h1 {
        font-size: var(--tam-titulo);
        color: var(--color-primario);
        margin-bottom: 1rem;
      }
      p {
        color: var(--color-texto-suave);
        margin-bottom: 0.5rem;
      }
    `,
  ],
})
export class HomeComponent {}
