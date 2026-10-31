import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@eterea/shared-api';
import { Ejercicio, EjercicioInput, SiguienteEjercicio } from './ejercicio.models';
import { EjercicioRepository } from './ejercicio.repository';

/** Implementación HTTP de ejercicios contra `/api/tenant/core/ejercicio`. */
@Injectable()
export class EjercicioHttpRepository implements EjercicioRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  listar(): Observable<readonly Ejercicio[]> {
    return this.http.get<readonly Ejercicio[]>(`${this.apiUrl}/ejercicio`);
  }

  obtener(ejercicioId: number): Observable<Ejercicio> {
    return this.http.get<Ejercicio>(`${this.apiUrl}/ejercicio/${this.id(ejercicioId)}`);
  }

  siguiente(): Observable<SiguienteEjercicio> {
    return this.http.get<SiguienteEjercicio>(`${this.apiUrl}/ejercicio/siguiente`);
  }

  crear(input: EjercicioInput): Observable<Ejercicio> {
    return this.http.post<Ejercicio>(`${this.apiUrl}/ejercicio`, input);
  }

  actualizar(ejercicioId: number, input: EjercicioInput): Observable<Ejercicio> {
    return this.http.put<Ejercicio>(`${this.apiUrl}/ejercicio/${this.id(ejercicioId)}`, input);
  }

  cambiarBloqueo(ejercicioId: number, bloqueado: boolean): Observable<Ejercicio> {
    return this.http.put<Ejercicio>(`${this.apiUrl}/ejercicio/${this.id(ejercicioId)}/bloqueo`, {
      bloqueado,
    });
  }

  eliminar(ejercicioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/ejercicio/${this.id(ejercicioId)}`);
  }

  private id(ejercicioId: number): string {
    return encodeURIComponent(String(ejercicioId));
  }
}
