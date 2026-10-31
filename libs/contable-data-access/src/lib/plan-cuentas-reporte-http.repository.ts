import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError } from 'rxjs';
import { ReporteDatos } from '@eterea/reporte-shared';
import { API_URL } from '@eterea/shared-api';
import { reporteErrorDesdeHttp } from './plan-cuentas-reporte-error';
import { PlanCuentasReporteRepository } from './plan-cuentas-reporte.repository';

/** Implementación HTTP del listado del plan de cuentas. */
@Injectable()
export class PlanCuentasReporteHttpRepository implements PlanCuentasReporteRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  private get base(): string {
    return `${this.apiUrl}/reporte/plan-cuentas`;
  }

  datos(): Observable<ReporteDatos> {
    return this.http
      .post<ReporteDatos>(`${this.base}/datos`, {})
      .pipe(catchError(reporteErrorDesdeHttp));
  }

  pdf(): Observable<Blob> {
    return this.http
      .post(`${this.base}/pdf`, {}, { responseType: 'blob' })
      .pipe(catchError(reporteErrorDesdeHttp));
  }
}
