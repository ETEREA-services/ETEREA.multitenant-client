import { Component, effect, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import {
  PLAN_CUENTAS_REPORTE_REPOSITORY,
  ReporteApiError,
} from '@eterea/contable-data-access';
import { ReporteDatos } from '@eterea/reporte-shared';
import { ContextoStore } from '@eterea/shared-api';
import {
  EtReporteLayoutComponent,
  descargarBlob,
  imprimirPdf,
} from '@eterea/ui-reportes';

@Component({
  selector: 'et-contable-reporte-plan-cuentas',
  imports: [EtReporteLayoutComponent],
  templateUrl: './plan-cuentas-reporte.html',
  styleUrl: './plan-cuentas-reporte.css',
})
export class PlanCuentasReportePageComponent {
  private readonly repository = inject(PLAN_CUENTAS_REPORTE_REPOSITORY);
  private readonly contextoStore = inject(ContextoStore);
  private claveContexto: string | null = null;
  private cargaVersion = 0;

  protected readonly datos = signal<ReporteDatos | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sinPermiso = signal(false);
  protected readonly descargando = signal(false);

  constructor() {
    // La pantalla sigue montada al cambiar de negocio: recargar el listado.
    effect(() => {
      const negocio = this.contextoStore.negocioActivo();
      const clave = negocio ? `${negocio.negocioId}:${negocio.tenantId}` : null;
      if (clave === this.claveContexto) {
        return;
      }
      this.claveContexto = clave;
      this.datos.set(null);
      this.error.set(null);
      this.sinPermiso.set(false);
      if (clave) {
        this.cargar();
      }
    });
  }

  protected cargar(): void {
    const version = ++this.cargaVersion;
    this.cargando.set(true);
    this.error.set(null);
    this.sinPermiso.set(false);

    this.repository
      .datos()
      .pipe(
        finalize(() => {
          if (version === this.cargaVersion) {
            this.cargando.set(false);
          }
        }),
      )
      .subscribe({
        next: (datos) => {
          if (version === this.cargaVersion) {
            this.datos.set(datos);
          }
        },
        error: (error: unknown) => {
          if (version === this.cargaVersion) {
            this.manejarError(error);
          }
        },
      });
  }

  protected descargar(): void {
    if (this.descargando()) {
      return;
    }
    this.descargando.set(true);
    this.error.set(null);

    this.repository
      .pdf()
      .pipe(finalize(() => this.descargando.set(false)))
      .subscribe({
        next: (blob) => descargarBlob(blob, this.nombreArchivo()),
        error: (error: unknown) => this.manejarError(error),
      });
  }

  protected imprimir(): void {
    if (this.descargando()) {
      return;
    }
    this.descargando.set(true);
    this.error.set(null);

    this.repository
      .pdf()
      .pipe(finalize(() => this.descargando.set(false)))
      .subscribe({
        next: (blob) => imprimirPdf(blob),
        error: (error: unknown) => this.manejarError(error),
      });
  }

  private manejarError(error: unknown): void {
    if (error instanceof ReporteApiError) {
      this.sinPermiso.set(error.status === 403);
      this.error.set(error.message);
      return;
    }
    this.error.set('No pudimos generar el listado. Intentá nuevamente.');
  }

  private nombreArchivo(): string {
    const datos = this.datos();
    const negocio = (datos?.negocio ?? 'negocio')
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-+|-+$)/g, '');
    const fecha = datos?.generadoEn ?? '';

    return `plan-cuentas-${negocio || 'negocio'}-${fecha}.pdf`;
  }
}
