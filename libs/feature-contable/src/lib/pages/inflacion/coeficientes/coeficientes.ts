import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CanDeactivateFn } from '@angular/router';
import { finalize } from 'rxjs';
import {
  COEFICIENTE_INFLACION_REPOSITORY,
  CoeficienteInflacionAnio,
  CoeficienteMensualInput,
  normalizarErrorCoeficienteInflacion,
} from '@eterea/contable-data-access';
import { AuthStore, ContextoStore } from '@eterea/shared-api';
import { EtIconComponent, EtPageHeaderComponent } from '@eterea/ui-layout';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Setiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

const ANHO_MINIMO = 1900;
const ANHO_MAXIMO = 2100;

interface FilaCoeficiente {
  mes: number;
  nombre: string;
  original: number | null;
  valor: string;
  cargado: boolean;
  modificado: boolean;
  error: string | null;
}

interface Confirmacion {
  titulo: string;
  mensaje: string;
  etiqueta: string;
  accion: () => void;
}

@Component({
  selector: 'et-contable-coeficientes-inflacion',
  imports: [FormsModule, EtPageHeaderComponent, EtIconComponent],
  templateUrl: './coeficientes.html',
  styleUrl: './coeficientes.css',
})
export class CoeficientesInflacionPageComponent {
  private readonly repository = inject(COEFICIENTE_INFLACION_REPOSITORY);
  private readonly authStore = inject(AuthStore);
  private readonly contextoStore = inject(ContextoStore);
  private claveContexto: string | null = null;
  private cargaVersion = 0;

  protected readonly esAdministrador = this.authStore.esAdministrador;

  protected readonly anho = signal(new Date().getFullYear());
  protected readonly aniosDisponibles = signal<readonly number[]>([]);
  protected readonly valores = signal<Readonly<Record<number, string>>>({});
  protected readonly originales = signal<Readonly<Record<number, number | null>>>({});

  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly sinPermiso = signal(false);
  protected readonly confirmacion = signal<Confirmacion | null>(null);

  protected readonly filas = computed<readonly FilaCoeficiente[]>(() => {
    const valores = this.valores();
    const originales = this.originales();

    return MESES.map((nombre, indice) => {
      const mes = indice + 1;
      const original = originales[mes] ?? null;
      const valor = valores[mes] ?? '';
      const parseado = parsearValor(valor);

      return {
        mes,
        nombre,
        original,
        valor,
        cargado: original !== null,
        modificado: !mismoValor(parseado, original),
        error: errorDeValor(valor),
      };
    });
  });

  protected readonly cargados = computed(
    () => this.filas().filter((fila) => fila.valor.trim() !== '' && fila.error === null).length,
  );
  protected readonly modificados = computed(() =>
    this.filas().filter((fila) => fila.modificado),
  );
  protected readonly hayCambios = computed(() => this.modificados().length > 0);
  protected readonly hayErrores = computed(() =>
    this.filas().some((fila) => fila.error !== null),
  );
  protected readonly puedeGuardar = computed(
    () => this.hayCambios() && !this.hayErrores() && !this.guardando() && this.esAdministrador(),
  );

  constructor() {
    // La pantalla puede seguir montada al cambiar de negocio desde el shell.
    effect(() => {
      const negocio = this.contextoStore.negocioActivo();
      const clave = negocio ? `${negocio.negocioId}:${negocio.tenantId}` : null;
      if (clave === this.claveContexto) {
        return;
      }
      this.claveContexto = clave;
      this.reiniciarPorContexto();
    });
  }

  protected actualizar(): void {
    if (!this.claveContexto) {
      return;
    }
    this.cargarAnios();
    this.cargar(this.anho());
  }

  protected cargar(anho: number): void {
    if (!this.claveContexto) {
      return;
    }

    const version = ++this.cargaVersion;
    this.cargando.set(true);
    this.error.set(null);
    this.sinPermiso.set(false);
    this.aviso.set(null);

    this.repository
      .obtenerAnio(anho)
      .pipe(
        finalize(() => {
          if (version === this.cargaVersion) {
            this.cargando.set(false);
          }
        }),
      )
      .subscribe({
        next: (anio) => {
          if (version !== this.cargaVersion) {
            return;
          }
          this.aplicarAnio(anio);
        },
        error: (error: unknown) => {
          if (version !== this.cargaVersion) {
            return;
          }
          const normalizado = normalizarErrorCoeficienteInflacion(error);
          this.error.set(normalizado.mensaje);
          this.sinPermiso.set(normalizado.status === 403);
        },
      });
  }

  protected cargarAnios(): void {
    if (!this.claveContexto) {
      return;
    }
    this.repository.listarAnios().subscribe({
      next: (anios) => this.aniosDisponibles.set(anios),
      error: () => this.aniosDisponibles.set([]),
    });
  }

  protected actualizarValor(mes: number, valor: string): void {
    this.valores.set({ ...this.valores(), [mes]: valor });
    this.aviso.set(null);
  }

  protected formatearFila(mes: number): void {
    const valor = this.valores()[mes] ?? '';
    const numero = parsearValor(valor);
    if (valor.trim() === '' || numero === null) {
      return;
    }
    this.valores.set({ ...this.valores(), [mes]: formatearValor(numero) });
  }

  protected limpiarMes(mes: number): void {
    const fila = this.filas().find((actual) => actual.mes === mes);
    if (!fila || fila.valor.trim() === '') {
      return;
    }

    const limpiar = () => {
      this.valores.set({ ...this.valores(), [fila.mes]: '' });
      this.aviso.set(null);
    };

    if (fila.original === null) {
      limpiar();
      return;
    }

    this.confirmacion.set({
      titulo: 'Limpiar coeficiente',
      mensaje: `Se va a quitar el coeficiente de ${fila.nombre}. El cambio se aplica al guardar.`,
      etiqueta: 'Limpiar',
      accion: limpiar,
    });
  }

  protected cambiarAnio(nuevoAnho: number): void {
    if (!Number.isInteger(nuevoAnho) || nuevoAnho < ANHO_MINIMO || nuevoAnho > ANHO_MAXIMO) {
      this.error.set(`El año debe estar entre ${ANHO_MINIMO} y ${ANHO_MAXIMO}.`);
      return;
    }
    if (nuevoAnho === this.anho()) {
      return;
    }
    if (this.hayCambios()) {
      this.confirmacion.set({
        titulo: 'Cambiar de año',
        mensaje: `Tenés cambios sin guardar en ${this.anho()}. Si cambiás de año se descartan.`,
        etiqueta: 'Cambiar',
        accion: () => {
          this.anho.set(nuevoAnho);
          this.limpiarVista();
          this.cargar(nuevoAnho);
        },
      });
      return;
    }
    this.anho.set(nuevoAnho);
    this.limpiarVista();
    this.cargar(nuevoAnho);
  }

  protected cambiarAnioDesdeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = Number(input.value);
    this.cambiarAnio(valor);
    input.value = String(this.anho());
  }

  protected confirmarAccion(): void {
    const actual = this.confirmacion();
    if (!actual) {
      return;
    }
    actual.accion();
    this.confirmacion.set(null);
  }

  protected cancelarConfirmacion(): void {
    this.confirmacion.set(null);
  }

  protected descartar(): void {
    this.aplicarOriginales();
    this.error.set(null);
    this.aviso.set(null);
  }

  protected guardar(): void {
    if (!this.puedeGuardar()) {
      return;
    }

    const cambios: CoeficienteMensualInput[] = this.modificados().map((fila) => {
      const numero = parsearValor(fila.valor);
      return {
        mes: fila.mes,
        coeficiente: numero === null ? null : redondear(numero),
      };
    });

    this.guardando.set(true);
    this.error.set(null);
    this.aviso.set(null);

    this.repository
      .guardarAnio(this.anho(), { meses: cambios })
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: (anio) => {
          this.aplicarAnio(anio);
          this.aviso.set(`Coeficientes de ${anio.anho} guardados.`);
          this.cargarAnios();
        },
        error: (error: unknown) => {
          const normalizado = normalizarErrorCoeficienteInflacion(error);
          this.error.set(normalizado.mensaje);
          this.sinPermiso.set(normalizado.status === 403);
        },
      });
  }

  protected cerrarAviso(): void {
    this.aviso.set(null);
  }

  /** Usado por el guard de salida para no perder cambios sin guardar. */
  puedeSalir(): boolean {
    if (!this.hayCambios()) {
      return true;
    }
    return window.confirm(
      'Tenés cambios sin guardar en los coeficientes. Si salís, se descartan.',
    );
  }

  protected dosDigitos(mes: number): string {
    return String(mes).padStart(2, '0');
  }

  protected estadoFila(fila: FilaCoeficiente): string {
    if (fila.modificado) {
      return 'Modificado';
    }
    return fila.cargado ? 'Cargado' : 'Sin cargar';
  }

  private aplicarAnio(anio: CoeficienteInflacionAnio): void {
    this.anho.set(anio.anho);

    const valores: Record<number, string> = {};
    const originales: Record<number, number | null> = {};
    for (const mes of anio.meses) {
      originales[mes.mes] = mes.coeficiente;
      valores[mes.mes] = mes.coeficiente === null ? '' : formatearValor(mes.coeficiente);
    }
    this.valores.set(valores);
    this.originales.set(originales);
  }

  private aplicarOriginales(): void {
    const valores: Record<number, string> = {};
    const originales = this.originales();
    for (let mes = 1; mes <= 12; mes++) {
      const original = originales[mes] ?? null;
      valores[mes] = original === null ? '' : formatearValor(original);
    }
    this.valores.set(valores);
  }

  private limpiarVista(): void {
    this.valores.set({});
    this.originales.set({});
  }

  private reiniciarPorContexto(): void {
    this.cargaVersion++;
    this.anho.set(new Date().getFullYear());
    this.aniosDisponibles.set([]);
    this.valores.set({});
    this.originales.set({});
    this.cargando.set(false);
    this.guardando.set(false);
    this.error.set(null);
    this.aviso.set(null);
    this.sinPermiso.set(false);
    this.confirmacion.set(null);

    if (!this.claveContexto) {
      return;
    }
    this.cargarAnios();
    this.cargar(this.anho());
  }
}

/**
 * Evita perder cambios al navegar a otra ruta. La recarga de la misma URL
 * (cambio de negocio desde el shell) la maneja el efecto de contexto.
 */
export const coeficientesPuedeSalirGuard: CanDeactivateFn<
  CoeficientesInflacionPageComponent
> = (component, _currentRoute, currentState, nextState) => {
  if (nextState.url === currentState.url) {
    return true;
  }
  return component.puedeSalir();
};

function parsearValor(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.');
  if (limpio === '' || !/^\d+(\.\d+)?$/.test(limpio)) {
    return null;
  }
  const valor = Number(limpio);
  return Number.isFinite(valor) ? valor : null;
}

function errorDeValor(texto: string): string | null {
  const limpio = texto.trim();
  if (limpio === '') {
    return null;
  }
  const normalizado = limpio.replace(',', '.');
  if (!/^\d+(\.\d{1,6})?$/.test(normalizado)) {
    return 'Usá un número mayor o igual a cero con hasta 6 decimales.';
  }
  const valor = Number(normalizado);
  if (!Number.isFinite(valor)) {
    return 'El valor no es válido.';
  }
  if (valor < 0) {
    return 'El coeficiente no puede ser negativo.';
  }
  return null;
}

function formatearValor(valor: number): string {
  const texto = valor.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  const [entero, decimales = ''] = texto.split('.');
  return `${entero}.${decimales.padEnd(4, '0')}`;
}

function redondear(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 1_000_000) / 1_000_000;
}

function mismoValor(primero: number | null, segundo: number | null): boolean {
  if (primero === null && segundo === null) {
    return true;
  }
  if (primero === null || segundo === null) {
    return false;
  }
  return Math.abs(primero - segundo) < 0.0000005;
}
