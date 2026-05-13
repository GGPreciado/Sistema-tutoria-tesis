import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly formulario = this.fb.nonNullable.group({
    codigo: ['', Validators.required],
    password: ['', Validators.required],
  });

  readonly cargando = signal(false);
  readonly errorMensaje = signal<string | null>(null);

  ngOnInit(): void {
    if (this.auth.estaAutenticado) {
      this.router.navigate(['/home']);
    }
  }

  get camposCodigo() {
    return this.formulario.controls.codigo;
  }

  get camposPassword() {
    return this.formulario.controls.password;
  }

  ingresar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.errorMensaje.set(null);

    const { codigo, password } = this.formulario.getRawValue();
    this.api.login({ codigo, password }).subscribe({
      next: (res) => {
        this.auth.guardarSesion(res.usuario);
        this.router.navigate(['/home']);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        if (err.status === 401) {
          this.errorMensaje.set('Código o contraseña incorrectos. Inténtalo de nuevo.');
        } else {
          this.errorMensaje.set('Ocurrió un error. Intenta más tarde.');
        }
      },
    });
  }
}
