export interface Usuario {
  id: string;
  nombre: string;
  codigo: string;
  rol: 'estudiante' | 'docente' | 'admin';
}
