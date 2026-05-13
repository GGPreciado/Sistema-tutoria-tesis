import { Injectable, signal } from '@angular/core';
import { Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_USER_ID = 'userId';
  private readonly STORAGE_USER = 'currentUser';

  readonly usuarioActual = signal<Usuario | null>(this.cargarUsuario());

  get userId(): string | null {
    return localStorage.getItem(this.STORAGE_USER_ID);
  }

  get estaAutenticado(): boolean {
    return !!this.userId;
  }

  guardarSesion(usuario: Usuario): void {
    localStorage.setItem(this.STORAGE_USER_ID, usuario.id);
    localStorage.setItem(this.STORAGE_USER, JSON.stringify(usuario));
    this.usuarioActual.set(usuario);
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.STORAGE_USER_ID);
    localStorage.removeItem(this.STORAGE_USER);
    this.usuarioActual.set(null);
  }

  private cargarUsuario(): Usuario | null {
    const json = localStorage.getItem(this.STORAGE_USER);
    return json ? (JSON.parse(json) as Usuario) : null;
  }
}
