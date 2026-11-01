import { Component, effect, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import {
  BALANCE_REPORTE_REPOSITORY,
  BalanceFiltro,
  BalanceModo,
  MonedaInfo,
  ReporteApiError,
} from '@eterea/contable-data-access';
import { ReporteDatos } from '@eterea/reporte-shared';
import { ContextoStore } from '@eterea/shared-api';
import {
  EtReporteLayoutComponent,
  descargarBlob,
  imprimirPdf,
} from '@eterea/ui-reportes';

/** Fecha de hoy en ISO local (`yyyy-MM-dd`), el valor que usa `<input type="date">`. */
function fechaHoyIso(fecha = new Date()): string {
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** Convierte una fecha ISO a `dd-MM-yyyy` para textos visibles y nombres de archivo. */
function fechaVisible(iso: string): string {
  const [anio, mes, dia] = iso.slice(0, 10).split('-');
  return anio && mes && dia ? `${dia}-${mes}-${anio}` : iso;
}

@Component({
  selector: 'et-contable-balance',
  imports: [ReactiveFormsModule, EtReporteLayoutComponent],
  templateUrl: './balance.html',
  styleUrl: './balance.css',
})
export class BalancePageComponent {
  private readonly repository = inject(BALANCE_REPORTE_REPOSITORY);
  private readonly contextoStore = inject(ContextoStore);
  private readonly fb = inject(FormBuilder);

  private claveContexto: string | null = null;
  private cargaVersion = 0;

  protected readonly hoy = fechaHoyIso();
  protected readonly filtros = this.fb.nonNullable.group({
    desde: [this.hoy, Validators.required],
    hasta: [this.hoy, Validators.required],
    incluyeApertura: [false],
    incluyeInflacion: [true],
    modo: ['ESTRUCTURA' as BalanceModo, Validators.required],
    monedaRegistroId: [1, Validators.required],
    monedaExpresionId: [1, Validators.required],
  });

  protected readonly datos = signal<ReporteDatos | null>(null);
  protected readonly monedas = signal<readonly MonedaInfo[]>([]);
  protected readonly cargando = signal(false);
  protected readonly cargandoMonedas = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sinPermiso = signal(false);
  protected readonly descargando = signal(false);
  protected readonly exportando = signal(false);

  constructor() {
    // La pantalla sigue montada al cambiar de negocio: recargar catálogo y
    // reporte, y volver a la moneda base.
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
      this.filtros.patchValue({ monedaRegistroId: 1, monedaExpresionId: 1 });
      if (clave) {
        this.cargarMonedas();
        this.cargar();
      }
    });
  }

  protected cargar(): void {
    const filtro = this.filtroParaConsultar();
    if (!filtro) {
      return;
    }

    const version = ++this.cargaVersion;
    this.cargando.set(true);
    this.error.set(null);
    this.sinPermiso.set(false);

    this.repository
      .datos(filtro)
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
    const filtro = this.filtroParaConsultar();
    if (!filtro) {
      return;
    }
    this.descargando.set(true);
    this.error.set(null);

    this.repository
      .pdf(filtro)
      .pipe(finalize(() => this.descargando.set(false)))
      .subscribe({
        next: (blob) => descargarBlob(blob, this.nombreArchivo('pdf')),
        error: (error: unknown) => this.manejarError(error),
      });
  }

  protected exportarXlsx(): void {
    if (this.exportando()) {
      return;
    }
    const filtro = this.filtroParaConsultar();
    if (!filtro) {
      return;
    }
    this.exportando.set(true);
    this.error.set(null);

    this.repository
      .xlsx(filtro)
      .pipe(finalize(() => this.exportando.set(false)))
      .subscribe({
        next: (blob) => descargarBlob(blob, this.nombreArchivo('xlsx')),
        error: (error: unknown) => this.manejarError(error),
      });
  }

  protected imprimir(): void {
    if (this.descargando()) {
      return;
    }
    const filtro = this.filtroParaConsultar();
    if (!filtro) {
      return;
    }
    this.descargando.set(true);
    this.error.set(null);

    this.repository
      .pdf(filtro)
      .pipe(finalize(() => this.descargando.set(false)))
      .subscribe({
        next: (blob) => imprimirPdf(blob),
        error: (error: unknown) => this.manejarError(error),
      });
  }

  protected cargarMonedas(): void {
    this.cargandoMonedas.set(true);
    this.repository
      .monedas()
      .pipe(finalize(() => this.cargandoMonedas.set(false)))
      .subscribe({
        next: (monedas) => {
          this.monedas.set(monedas);
          const base = monedas.find((moneda) => moneda.esBase)?.monedaId
            ?? monedas[0]?.monedaId
            ?? 1;
          const actual = this.filtros.getRawValue();
          if (!monedas.some((moneda) => moneda.monedaId === actual.monedaRegistroId)) {
            this.filtros.patchValue({ monedaRegistroId: base });
          }
          if (!monedas.some((moneda) => moneda.monedaId === actual.monedaExpresionId)) {
            this.filtros.patchValue({ monedaExpresionId: base });
          }
        },
        error: (error: unknown) => this.manejarError(error),
      });
  }

  protected filtro(): BalanceFiltro {
    const valor = this.filtros.getRawValue();
    return {
      desde: valor.desde,
      hasta: valor.hasta,
      incluyeApertura: valor.incluyeApertura,
      incluyeInflacion: valor.incluyeInflacion,
      modo: valor.modo,
      monedaRegistroId: valor.monedaRegistroId,
      monedaExpresionId: valor.monedaExpresionId,
    };
  }

  private filtroParaConsultar(): BalanceFiltro | null {
    this.filtros.markAllAsTouched();
    if (this.filtros.invalid) {
      this.error.set('Ingresá las fechas desde y hasta.');
      return null;
    }
    const filtro = this.filtro();
    if (filtro.desde > filtro.hasta) {
      this.error.set('La fecha desde no puede ser posterior a la hasta.');
      return null;
    }
    return filtro;
  }

  private manejarError(error: unknown): void {
    if (error instanceof ReporteApiError) {
      this.sinPermiso.set(error.status === 403);
      this.error.set(error.message);
      return;
    }
    this.error.set('No pudimos generar el balance. Intentá nuevamente.');
  }

  private nombreArchivo(extension: 'pdf' | 'xlsx'): string {
    const datos = this.datos();
    const negocio = (datos?.negocio ?? 'negocio')
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-+|-+$)/g, '');
    const valor = this.filtros.getRawValue();
    const codigo = datos?.codigo ?? 'balance-general';
    const desde = fechaVisible(valor.desde);
    const hasta = fechaVisible(valor.hasta);
    return `${codigo}-${negocio || 'negocio'}-${desde}-${hasta}.${extension}`;
  }
}
