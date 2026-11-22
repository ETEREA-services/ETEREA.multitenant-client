import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  CuentaBusqueda,
  MAYOR_REPORTE_REPOSITORY,
  MONEDA_REPOSITORY,
  MayorDatos,
  MayorFiltro,
  MonedaInfo,
  ReporteApiError,
} from '@eterea/contable-data-access';
import { ContextoStore, fechaArchivo } from '@eterea/shared-api';
import { EtDateInputComponent, EtIconComponent } from '@eterea/ui-layout';
import { EtReporteLayoutComponent, descargarBlob, imprimirPdf } from '@eterea/ui-reportes';
import { CuentaLookupComponent } from '../../components/cuenta-lookup/cuenta-lookup';
import { MonedaSelectComponent } from '../../components/moneda-select/moneda-select';

/** Fecha de hoy en ISO local (`yyyy-MM-dd`), el valor que usan los campos de fecha. */
function fechaHoyIso(fecha = new Date()): string {
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

@Component({
  selector: 'et-contable-mayor',
  imports: [
    ReactiveFormsModule,
    EtReporteLayoutComponent,
    EtDateInputComponent,
    EtIconComponent,
    CuentaLookupComponent,
    MonedaSelectComponent,
  ],
  templateUrl: './mayor.html',
  styleUrl: './mayor.css',
})
export class MayorPageComponent {
  private readonly repository = inject(MAYOR_REPORTE_REPOSITORY);
  private readonly monedaRepository = inject(MONEDA_REPOSITORY);
  private readonly contextoStore = inject(ContextoStore);
  private readonly fb = inject(FormBuilder);

  private claveContexto: string | null = null;
  private cargaVersion = 0;

  protected readonly hoy = fechaHoyIso();
  protected readonly filtros = this.fb.nonNullable.group({
    cuenta: this.fb.control<number | null>(null, Validators.required),
    desde: [this.hoy, Validators.required],
    hasta: [this.hoy, Validators.required],
    sinSaldoAnterior: [false],
    monedaRegistroId: [1, Validators.required],
    monedaExpresionId: [1, Validators.required],
  });

  protected readonly datos = signal<MayorDatos | null>(null);
  protected readonly monedas = signal<readonly MonedaInfo[]>([]);
  protected readonly cuentaTexto = signal('');
  protected readonly buscadorAbierto = signal(false);
  protected readonly textoInicial = signal('');
  protected readonly cargando = signal(false);
  protected readonly cargandoMonedas = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sinPermiso = signal(false);
  protected readonly descargando = signal(false);
  protected readonly exportando = signal(false);

  constructor() {
    // La pantalla sigue montada al cambiar de negocio: limpiar la cuenta y el
    // reporte, y recargar el catálogo de monedas.
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
      this.cuentaTexto.set('');
      this.filtros.patchValue({
        cuenta: null,
        monedaRegistroId: 1,
        monedaExpresionId: 1,
      });
      if (clave) {
        this.cargarMonedas();
      }
    });
  }

  protected abrirBuscador(texto = ''): void {
    this.textoInicial.set(texto);
    this.buscadorAbierto.set(true);
  }

  protected alTeclearCuenta(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.abrirBuscador();
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      this.abrirBuscador(event.key);
    }
  }

  protected seleccionarCuenta(cuenta: CuentaBusqueda): void {
    this.filtros.patchValue({ cuenta: cuenta.numeroCuenta });
    this.filtros.controls.cuenta.markAsDirty();
    this.cuentaTexto.set(cuenta.descripcion);
    this.buscadorAbierto.set(false);
    this.datos.set(null);
    this.error.set(null);
  }

  protected cuentaInvalida(): boolean {
    const control = this.filtros.controls.cuenta;
    return control.invalid && (control.touched || control.dirty);
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

  private filtro(): MayorFiltro {
    const valor = this.filtros.getRawValue();
    return {
      cuenta: valor.cuenta as number,
      desde: valor.desde,
      hasta: valor.hasta,
      sinSaldoAnterior: valor.sinSaldoAnterior,
      monedaRegistroId: valor.monedaRegistroId,
      monedaExpresionId: valor.monedaExpresionId,
    };
  }

  private filtroParaConsultar(): MayorFiltro | null {
    this.filtros.markAllAsTouched();
    const valor = this.filtros.getRawValue();
    if (valor.cuenta == null) {
      this.error.set('Elegí una cuenta contable.');
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
    return this.filtro();
  }

  private manejarError(error: unknown): void {
    if (error instanceof ReporteApiError) {
      this.sinPermiso.set(error.status === 403);
      this.error.set(error.message);
      return;
    }
    this.error.set('No pudimos generar el Mayor. Intentá nuevamente.');
  }

  private nombreArchivo(extension: 'pdf' | 'xlsx'): string {
    const datos = this.datos();
    const negocio = (datos?.reporte.negocio ?? 'negocio')
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-+|-+$)/g, '');
    const valor = this.filtros.getRawValue();
    const codigo = datos?.reporte.codigo ?? 'mayor';
    const desde = fechaArchivo(valor.desde);
    const hasta = fechaArchivo(valor.hasta);
    return `${codigo}-${negocio || 'negocio'}-${desde}-${hasta}.${extension}`;
  }
}
