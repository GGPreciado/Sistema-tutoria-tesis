import { Component } from '@angular/core';

// Placeholder — se implementa en el Paso 10 del sprint-mvp.md.
// Tendrá: formulario reactivo (codigo + password), llamada a AuthService,
// redirección a #/home tras login exitoso.
@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="login-placeholder">
      <h1>Iniciar Sesión</h1>
      <p>Esta pantalla se implementa en el Paso 10.</p>
      <p>Formulario: código de estudiante + contraseña.</p>
    </div>
  `,
  styles: [
    `
      .login-placeholder {
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
export class LoginComponent {}
