import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  CuentaBusqueda,
  MAYOR_DISCRIMINADO_REPORTE_REPOSITORY,
  MONEDA_REPOSITORY,
  MayorDiscriminadoFiltro,
  MonedaInfo,
  ReporteApiError,
} from '@eterea/contable-data-access';
import { ReporteDatos } from '@eterea/reporte-shared';
import { ContextoStore, fechaArchivo } from '@eterea/shared-api';
import { EtDateInputComponent, EtIconComponent } from '@eterea/ui-layout';
import { EtReporteLayoutComponent, descargarBlob, imprimirPdf } from '@eterea/ui-reportes';
import { CuentaLookupComponent } from '../../components/cuenta-lookup/cuenta-lookup';
import { MonedaSelectComponent } from '../../components/moneda-select/moneda-select';

/** Fecha de hoy en ISO local (`yyyy-MM-dd`). */
function fechaHoyIso(fecha = new Date()): string {
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

@Component({
  selector: 'et-contable-mayor-discriminado',
  imports: [
    ReactiveFormsModule,
    EtReporteLayoutComponent,
    EtDateInputComponent,
    EtIconComponent,
    CuentaLookupComponent,
    MonedaSelectComponent,
  ],
  templateUrl: './discriminado.html',
  styleUrl: './discriminado.css',
})
export class MayorDiscriminadoPageComponent {
  private static readonly UMBRAL_AVISO = 50;

  private readonly repository = inject(MAYOR_DISCRIMINADO_REPORTE_REPOSITORY);
  private readonly monedaRepository = inject(MONEDA_REPOSITORY);
  private readonly contextoStore = inject(ContextoStore);
  private readonly fb = inject(FormBuilder);

  private claveContexto: string | null = null;
  private cargaVersion = 0;

  protected readonly hoy = fechaHoyIso();
  protected readonly filtros = this.fb.nonNullable.group({
    desde: [this.hoy, Validators.required],
    hasta: [this.hoy, Validators.required],
    monedaRegistroId: [1, Validators.required],
    monedaExpresionId: [1, Validators.required],
  });

  protected readonly cuentas = signal<readonly CuentaBusqueda[]>([]);
  protected readonly datos = signal<ReporteDatos | null>(null);
  protected readonly monedas = signal<readonly MonedaInfo[]>([]);
  protected readonly buscadorAbierto = signal(false);
  protected readonly textoInicial = signal('');
  protected readonly cargando = signal(false);
  protected readonly cargandoMonedas = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sinPermiso = signal(false);
  protected readonly descargando = signal(false);
  protected readonly exportando = signal(false);

  constructor() {
    effect(() => {
      const negocio = this.contextoStore.negocioActivo();
      const clave = negocio ? `${negocio.negocioId}:${negocio.tenantId}` : null;
      if (clave === this.claveContexto) {
        return;
      }
      this.claveContexto = clave;
      this.cuentas.set([]);
      this.datos.set(null);
      this.error.set(null);
      this.sinPermiso.set(false);
      this.filtros.patchValue({ monedaRegistroId: 1, monedaExpresionId: 1 });
      if (clave) {
        this.cargarMonedas();
      }
    });
  }

  protected abrirBuscador(texto = ''): void {
    this.textoInicial.set(texto);
    this.buscadorAbierto.set(true);
  }

  protected agregarCuenta(cuenta: CuentaBusqueda): void {
    if (this.cuentas().some((actual) => actual.numeroCuenta === cuenta.numeroCuenta)) {
      return;
    }
    this.cuentas.update((actuales) => [...actuales, cuenta]);
    this.buscadorAbierto.set(false);
    this.datos.set(null);
    this.error.set(null);
  }

  protected quitarCuenta(numeroCuenta: number): void {
    this.cuentas.update((actuales) =>
      actuales.filter((cuenta) => cuenta.numeroCuenta !== numeroCuenta),
    );
    this.datos.set(null);
  }

  protected vaciarCuentas(): void {
    this.cuentas.set([]);
    this.datos.set(null);
  }

  protected avisoSeleccion(): string | null {
    const cantidad = this.cuentas().length;
    return cantidad > MayorDiscriminadoPageComponent.UMBRAL_AVISO
      ? `La selección tiene ${cantidad} cuentas; el reporte puede ser grande.`
      : null;
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
    this.monedaRepository
      .listar()
      .pipe(finalize(() => this.cargandoMonedas.set(false)))
      .subscribe({
        next: (monedas) => {
          this.monedas.set(monedas);
          const base =
            monedas.find((moneda) => moneda.esBase)?.monedaId ?? monedas[0]?.monedaId ?? 1;
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

  private filtroParaConsultar(): MayorDiscriminadoFiltro | null {
    this.filtros.markAllAsTouched();
    const valor = this.filtros.getRawValue();
    if (this.cuentas().length === 0) {
      this.error.set('Agregá al menos una cuenta.');
      return null;
    }
    if (!valor.desde || !valor.hasta) {
      this.error.set('Ingresá las fechas desde y hasta.');
      return null;
    }
    if (valor.desde > valor.hasta) {
      this.error.set('La fecha desde no puede ser posterior a la hasta.');
      return null;
    }
    return {
      cuentas: this.cuentas().map((cuenta) => cuenta.numeroCuenta),
      desde: valor.desde,
      hasta: valor.hasta,
      monedaRegistroId: valor.monedaRegistroId,
      monedaExpresionId: valor.monedaExpresionId,
    };
  }

  private manejarError(error: unknown): void {
    if (error instanceof ReporteApiError) {
      this.sinPermiso.set(error.status === 403);
      this.error.set(error.message);
      return;
    }
    this.error.set('No pudimos generar el Mayor Discriminado. Intentá nuevamente.');
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
    const codigo = datos?.codigo ?? 'mayor-discriminado';
    const desde = fechaArchivo(valor.desde);
    const hasta = fechaArchivo(valor.hasta);
    return `${codigo}-${negocio || 'negocio'}-${desde}-${hasta}.${extension}`;
  }
}
