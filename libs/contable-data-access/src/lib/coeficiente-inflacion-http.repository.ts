import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@eterea/shared-api';
import {
  CoeficienteInflacionAnio,
  CoeficienteInflacionAnioInput,
} from './coeficiente-inflacion.models';
import { CoeficienteInflacionRepository } from './coeficiente-inflacion.repository';

/** Implementación HTTP de coeficientes contra `/api/tenant/core/coeficiente-inflacion`. */
@Injectable()
export class CoeficienteInflacionHttpRepository
  implements CoeficienteInflacionRepository
{
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  listarAnios(): Observable<readonly number[]> {
    return this.http.get<readonly number[]>(
      `${this.apiUrl}/coeficiente-inflacion/anios`,
    );
  }

  obtenerAnio(anho: number): Observable<CoeficienteInflacionAnio> {
    return this.http.get<CoeficienteInflacionAnio>(
      `${this.apiUrl}/coeficiente-inflacion/anio/${this.id(anho)}`,
    );
  }

  guardarAnio(
    anho: number,
    input: CoeficienteInflacionAnioInput,
  ): Observable<CoeficienteInflacionAnio> {
    return this.http.put<CoeficienteInflacionAnio>(
      `${this.apiUrl}/coeficiente-inflacion/anio/${this.id(anho)}`,
      input,
    );
  }

  private id(anho: number): string {
    return encodeURIComponent(String(anho));
  }
}
