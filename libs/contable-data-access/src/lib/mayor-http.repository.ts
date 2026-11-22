import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError } from 'rxjs';
import { API_URL } from '@eterea/shared-api';
import { MayorDatos, MayorFiltro } from './mayor.models';
import { MayorReporteRepository } from './mayor.repository';
import { reporteErrorDesdeHttp } from './plan-cuentas-reporte-error';

/** Implementación HTTP del reporte Mayor. */
@Injectable()
export class MayorReporteHttpRepository implements MayorReporteRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  private get base(): string {
    return `${this.apiUrl}/reporte/mayor`;
  }

  datos(filtro: MayorFiltro): Observable<MayorDatos> {
    return this.http
      .post<MayorDatos>(`${this.base}/datos`, filtro)
      .pipe(catchError(reporteErrorDesdeHttp));
  }

  pdf(filtro: MayorFiltro): Observable<Blob> {
    return this.http
      .post(`${this.base}/pdf`, filtro, { responseType: 'blob' })
      .pipe(catchError(reporteErrorDesdeHttp));
  }

  xlsx(filtro: MayorFiltro): Observable<Blob> {
    return this.http
      .post(`${this.base}/xlsx`, filtro, { responseType: 'blob' })
      .pipe(catchError(reporteErrorDesdeHttp));
  }
}
