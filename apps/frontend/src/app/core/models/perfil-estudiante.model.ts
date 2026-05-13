export interface PuntosPorCurso {
  cursoId: number;
  cursoNombre: string;
  puntosTotal: number;
  posicion: number;
}

export interface Logro {
  id: string;
  nombre: string;
  descripcion: string;
  iconoUrl: string | null;
  obtenidoEn: string;
}

export interface PerfilEstudiante {
  id: string;
  nombre: string;
  codigo: string;
  puntosTotal: number;
  puntosPorCurso: PuntosPorCurso[];
  logros: Logro[];
}
