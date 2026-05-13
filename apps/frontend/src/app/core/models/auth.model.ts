import { Usuario } from './usuario.model';

export interface LoginRequest {
  codigo: string;
  password: string;
}

export interface LoginResponse {
  usuario: Usuario;
}
