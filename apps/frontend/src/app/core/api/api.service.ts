import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/auth.model';
import { PerfilEstudiante } from '../models/perfil-estudiante.model';
import { Curso } from '../models/curso.model';
import { Tema } from '../models/tema.model';
import {
  Evaluacion,
  RespuestaEnvio,
  ResultadoEvaluacion,
} from '../models/evaluacion.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, payload);
  }

  getPerfil(): Observable<PerfilEstudiante> {
    return this.http.get<PerfilEstudiante>(`${this.base}/students/me`);
  }

  getCursos(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${this.base}/courses`);
  }

  getTemas(cursoId: number): Observable<Tema[]> {
    return this.http.get<Tema[]>(`${this.base}/courses/${cursoId}/topics`);
  }

  iniciarEvaluacion(temaId: number): Observable<Evaluacion> {
    return this.http.post<Evaluacion>(`${this.base}/evaluations`, { temaId });
  }

  finalizarEvaluacion(
    evaluacionId: string,
    respuestas: RespuestaEnvio[],
  ): Observable<ResultadoEvaluacion> {
    return this.http.post<ResultadoEvaluacion>(
      `${this.base}/evaluations/${evaluacionId}/finalize`,
      { respuestas },
    );
  }
}
