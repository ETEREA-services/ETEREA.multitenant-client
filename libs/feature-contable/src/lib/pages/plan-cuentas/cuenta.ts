import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import {
  CUENTA_REPOSITORY,
  Cuenta,
  CuentaInput,
  CuentaNodo,
  CuentaUpdateInput,
  normalizarErrorCuenta,
} from '@eterea/contable-data-access';
import { AuthStore, ContextoStore } from '@eterea/shared-api';
import { EtEmptyStateComponent, EtIconComponent, EtPageHeaderComponent } from '@eterea/ui-layout';

type ModoDetalle = 'detalle' | 'crear' | 'editar';

interface FormularioCuenta {
  numeroCuenta: string;
  nombre: string;
  cuentaMaestro: string;
  transfiere: boolean;
  movimientoStock: boolean;
  ventas: boolean;
  compras: boolean;
  gastos: boolean;
}

interface FilaArbol {
  nodo: CuentaNodo;
  profundidad: number;
  tieneHijos: boolean;
  expandido: boolean;
}

const FORMULARIO_VACIO: FormularioCuenta = {
  numeroCuenta: '',
  nombre: '',
  cuentaMaestro: '0',
  transfiere: false,
  movimientoStock: false,
  ventas: false,
  compras: false,
  gastos: false,
};

@Component({
  selector: 'et-contable-plan-cuentas',
  imports: [FormsModule, RouterLink, EtPageHeaderComponent, EtEmptyStateComponent, EtIconComponent],
  templateUrl: './cuenta.html',
  styleUrl: './cuenta.css',
})
export class CuentaPageComponent {
  private readonly repository = inject(CUENTA_REPOSITORY);
  private readonly authStore = inject(AuthStore);
  private readonly contextoStore = inject(ContextoStore);
  private inicializado = false;
  private claveContexto: string | null = null;
  private cargaVersion = 0;

  constructor() {
    // La pantalla puede seguir montada cuando el usuario cambia de negocio
    // desde el shell. Recargar listado y árbol al cambiar el contexto activo.
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

  protected readonly esAdministrador = this.authStore.esAdministrador;

  protected readonly cuentas = signal<readonly Cuenta[]>([]);
  protected readonly arbol = signal<readonly CuentaNodo[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sinPermiso = signal(false);

  protected readonly filtro = signal('');
  protected readonly soloMovimiento = signal(false);
  protected readonly expandidos = signal<ReadonlySet<number>>(new Set());

  protected readonly seleccionada = signal<Cuenta | null>(null);
  protected readonly modo = signal<ModoDetalle>('detalle');
  protected readonly guardando = signal(false);
  protected readonly confirmandoBaja = signal(false);
  protected readonly errorFormulario = signal<string | null>(null);
  protected formulario: FormularioCuenta = { ...FORMULARIO_VACIO };

  private readonly huerfanas = computed<ReadonlySet<number>>(() => {
    const codigos = new Set<number>();
    const recorrer = (nodos: readonly CuentaNodo[]): void => {
      for (const nodo of nodos) {
        if (nodo.huerfana) {
          codigos.add(nodo.cuenta.numeroCuenta);
        }
        recorrer(nodo.hijos);
      }
    };
    recorrer(this.arbol());
    return codigos;
  });

  protected readonly filas = computed<readonly FilaArbol[]>(() => {
    const termino = this.filtro().trim().toLowerCase();
    const soloMovimiento = this.soloMovimiento();
    const filtroActivo = termino.length > 0 || soloMovimiento;
    const expandidos = this.expandidos();

    const coincide = (cuenta: Cuenta): boolean => {
      if (soloMovimiento && cuenta.integra) {
        return false;
      }
      if (!termino) {
        return true;
      }
      return (
        String(cuenta.numeroCuenta).includes(termino) ||
        cuenta.nombre.toLowerCase().includes(termino)
      );
    };

    const filtrar = (nodos: readonly CuentaNodo[]): readonly CuentaNodo[] => {
      const resultado: CuentaNodo[] = [];
      for (const nodo of nodos) {
        const hijos = filtrar(nodo.hijos);
        if (coincide(nodo.cuenta) || hijos.length > 0) {
          resultado.push({ ...nodo, hijos });
        }
      }
      return resultado;
    };

    const aplanar = (nodos: readonly CuentaNodo[], profundidad: number): readonly FilaArbol[] => {
      const resultado: FilaArbol[] = [];
      for (const nodo of nodos) {
        const tieneHijos = nodo.hijos.length > 0;
        const expandido = tieneHijos && (filtroActivo || expandidos.has(nodo.cuenta.numeroCuenta));
        resultado.push({ nodo, profundidad, tieneHijos, expandido });
        if (expandido) {
          resultado.push(...aplanar(nodo.hijos, profundidad + 1));
        }
      }
      return resultado;
    };

    return aplanar(filtrar(this.arbol()), 0);
  });

  protected readonly cuentasDeMovimiento = computed(
    () => this.cuentas().filter((cuenta) => !cuenta.integra).length,
  );

  /** Código que recibe el foco inicial del árbol (seleccionado o primera fila). */
  protected readonly codigoFoco = computed<number | null>(() => {
    const seleccionado = this.seleccionada()?.numeroCuenta;
    const filas = this.filas();
    if (
      seleccionado !== undefined &&
      filas.some((f) => f.nodo.cuenta.numeroCuenta === seleccionado)
    ) {
      return seleccionado;
    }
    return filas[0]?.nodo.cuenta.numeroCuenta ?? null;
  });

  protected cargar(): void {
    const version = ++this.cargaVersion;
    this.cargando.set(true);
    this.error.set(null);
    this.sinPermiso.set(false);

    forkJoin({
      listado: this.repository.listar(),
      arbol: this.repository.arbol(),
    })
      .pipe(
        finalize(() => {
          if (version === this.cargaVersion) {
            this.cargando.set(false);
          }
        }),
      )
      .subscribe({
        next: ({ listado, arbol }) => {
          if (version !== this.cargaVersion) {
            return;
          }
          this.cuentas.set(listado);
          this.arbol.set(arbol);
          if (!this.inicializado) {
            this.inicializado = true;
            this.expandidos.set(new Set(arbol.map((nodo) => nodo.cuenta.numeroCuenta)));
          }
          this.sincronizarSeleccion();
        },
        error: (error: unknown) => {
          if (version !== this.cargaVersion) {
            return;
          }
          const normalizado = normalizarErrorCuenta(error);
          this.error.set(normalizado.mensaje);
          this.sinPermiso.set(normalizado.status === 403);
        },
      });
  }

  protected actualizarFiltro(termino: string): void {
    this.filtro.set(termino);
  }

  protected alternarSoloMovimiento(valor: boolean): void {
    this.soloMovimiento.set(valor);
  }

  protected limpiarFiltros(): void {
    this.filtro.set('');
    this.soloMovimiento.set(false);
  }

  protected seleccionar(fila: FilaArbol): void {
    if (this.guardando()) {
      return;
    }
    this.seleccionada.set(fila.nodo.cuenta);
    this.modo.set('detalle');
    this.confirmandoBaja.set(false);
    this.errorFormulario.set(null);
    this.formulario = this.formularioDesdeCuenta(fila.nodo.cuenta);
  }

  protected alternar(fila: FilaArbol, evento: Event): void {
    evento.stopPropagation();
    if (!fila.tieneHijos) {
      return;
    }
    const codigo = fila.nodo.cuenta.numeroCuenta;
    this.expandidos.update((actual) => {
      const copia = new Set(actual);
      if (copia.has(codigo)) {
        copia.delete(codigo);
      } else {
        copia.add(codigo);
      }
      return copia;
    });
  }

  protected abrirAlta(): void {
    if (this.guardando()) {
      return;
    }
    this.seleccionada.set(null);
    this.modo.set('crear');
    this.confirmandoBaja.set(false);
    this.errorFormulario.set(null);
    this.formulario = { ...FORMULARIO_VACIO };
  }

  protected abrirEdicion(): void {
    const cuenta = this.seleccionada();
    if (!cuenta || this.guardando()) {
      return;
    }
    this.modo.set('editar');
    this.confirmandoBaja.set(false);
    this.errorFormulario.set(null);
    this.formulario = this.formularioDesdeCuenta(cuenta);
  }

  protected cancelar(): void {
    if (this.guardando()) {
      return;
    }
    this.errorFormulario.set(null);
    this.confirmandoBaja.set(false);
    const cuenta = this.seleccionada();
    if (cuenta) {
      this.formulario = this.formularioDesdeCuenta(cuenta);
      this.modo.set('detalle');
    } else {
      this.modo.set('detalle');
    }
  }

  protected solicitarBaja(): void {
    if (!this.esAdministrador() || !this.seleccionada() || this.guardando()) {
      return;
    }
    this.errorFormulario.set(null);
    this.confirmandoBaja.set(true);
  }

  protected cancelarBaja(): void {
    this.confirmandoBaja.set(false);
  }

  protected eliminar(): void {
    const cuenta = this.seleccionada();
    if (!cuenta || !this.esAdministrador() || this.guardando()) {
      return;
    }

    this.guardando.set(true);
    this.errorFormulario.set(null);

    this.repository
      .eliminar(cuenta.numeroCuenta)
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: () => {
          this.confirmandoBaja.set(false);
          this.seleccionada.set(null);
          this.modo.set('detalle');
          this.cargar();
        },
        error: (error: unknown) => {
          this.confirmandoBaja.set(false);
          this.errorFormulario.set(normalizarErrorCuenta(error).mensaje);
        },
      });
  }

  protected guardar(): void {
    if (this.guardando()) {
      return;
    }

    const validacion = this.validar();
    if (validacion) {
      this.errorFormulario.set(validacion);
      return;
    }

    const nombre = this.formulario.nombre.trim();
    const cuentaMaestro = Number(this.formulario.cuentaMaestro) || 0;
    const flags = {
      cuentaMaestro,
      transfiere: this.formulario.transfiere,
      movimientoStock: this.formulario.movimientoStock,
      ventas: this.formulario.ventas,
      compras: this.formulario.compras,
      gastos: this.formulario.gastos,
    };

    this.guardando.set(true);
    this.errorFormulario.set(null);

    if (this.modo() === 'crear') {
      const input: CuentaInput = {
        numeroCuenta: Number(this.formulario.numeroCuenta),
        nombre,
        ...flags,
      };
      this.repository
        .crear(input)
        .pipe(finalize(() => this.guardando.set(false)))
        .subscribe({
          next: (cuenta) => this.finalizarGuardado(cuenta),
          error: (error: unknown) => this.errorFormulario.set(normalizarErrorCuenta(error).mensaje),
        });
      return;
    }

    const cuenta = this.seleccionada();
    if (!cuenta) {
      this.guardando.set(false);
      this.errorFormulario.set('Elegí una cuenta para editar.');
      return;
    }

    const input: CuentaUpdateInput = { nombre, ...flags };
    this.repository
      .actualizar(cuenta.numeroCuenta, input)
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: (actualizada) => this.finalizarGuardado(actualizada),
        error: (error: unknown) => this.errorFormulario.set(normalizarErrorCuenta(error).mensaje),
      });
  }

  protected cuentaMaestroVisible(cuenta: Cuenta | null): string {
    if (!cuenta || !cuenta.cuentaMaestro) {
      return '—';
    }
    return String(cuenta.cuentaMaestro);
  }

  protected esHuerfana(cuenta: Cuenta): boolean {
    return this.huerfanas().has(cuenta.numeroCuenta);
  }

  protected estadoCuenta(cuenta: Cuenta): string {
    return cuenta.integra ? 'Con subcuentas' : 'Movimiento';
  }

  protected flagsActivas(cuenta: Cuenta): ReadonlyArray<string> {
    const flags: string[] = [];
    if (cuenta.transfiere) {
      flags.push('Transfiere');
    }
    if (cuenta.movimientoStock) {
      flags.push('Stock');
    }
    if (cuenta.ventas) {
      flags.push('Ventas');
    }
    if (cuenta.compras) {
      flags.push('Compras');
    }
    if (cuenta.gastos) {
      flags.push('Gastos');
    }
    return flags;
  }

  protected jerarquia(cuenta: Cuenta): ReadonlyArray<number> {
    return [cuenta.grado1, cuenta.grado2, cuenta.grado3, cuenta.grado4].filter(
      (codigo, indice, lista) =>
        codigo > 0 && codigo !== cuenta.numeroCuenta && lista.indexOf(codigo) === indice,
    );
  }

  protected alTeclearArbol(evento: KeyboardEvent): void {
    if (evento.key === 'Escape') {
      this.cancelar();
      return;
    }

    const objetivo = evento.target as HTMLElement | null;
    const filaActual = objetivo?.closest<HTMLElement>('[data-fila]') ?? null;
    const contenedor = filaActual?.closest<HTMLElement>('[role="tree"]') ?? null;
    if (!contenedor) {
      return;
    }
    const filas = Array.from(contenedor.querySelectorAll<HTMLElement>('[data-fila]'));
    const indice = filaActual ? filas.indexOf(filaActual) : -1;

    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault();
      if (filas.length === 0) {
        return;
      }
      const destino =
        evento.key === 'ArrowDown'
          ? Math.min(indice + 1, filas.length - 1)
          : Math.max(indice - 1, 0);
      filas[destino]?.focus();
      return;
    }

    if (evento.key === 'ArrowRight' || evento.key === 'ArrowLeft') {
      if (indice < 0) {
        return;
      }
      const fila = this.filas()[indice];
      if (!fila || !fila.tieneHijos) {
        return;
      }
      evento.preventDefault();
      const debeExpandir = evento.key === 'ArrowRight';
      if (debeExpandir === fila.expandido) {
        return;
      }
      this.alternar(fila, evento);
    }
  }

  private reiniciarPorContexto(): void {
    this.cuentas.set([]);
    this.arbol.set([]);
    this.seleccionada.set(null);
    this.modo.set('detalle');
    this.guardando.set(false);
    this.confirmandoBaja.set(false);
    this.errorFormulario.set(null);
    this.filtro.set('');
    this.soloMovimiento.set(false);
    this.expandidos.set(new Set());
    this.inicializado = false;

    if (!this.claveContexto) {
      this.cargando.set(false);
      return;
    }
    this.cargar();
  }

  private finalizarGuardado(cuenta: Cuenta): void {
    this.filtro.set('');
    this.soloMovimiento.set(false);
    this.expandirAncestros(cuenta);
    this.cargar();
    this.seleccionada.set(cuenta);
    this.modo.set('detalle');
    this.confirmandoBaja.set(false);
    this.formulario = this.formularioDesdeCuenta(cuenta);
  }

  private expandirAncestros(cuenta: Cuenta): void {
    this.expandidos.update((actual) => {
      const copia = new Set(actual);
      for (const codigo of [cuenta.grado1, cuenta.grado2, cuenta.grado3, cuenta.grado4]) {
        if (codigo > 0 && codigo !== cuenta.numeroCuenta) {
          copia.add(codigo);
        }
      }
      return copia;
    });
  }

  private sincronizarSeleccion(): void {
    const actual = this.seleccionada();
    if (!actual) {
      return;
    }
    const nueva =
      this.cuentas().find((cuenta) => cuenta.numeroCuenta === actual.numeroCuenta) ?? null;
    this.seleccionada.set(nueva);
    if (!nueva && this.modo() !== 'crear') {
      this.modo.set('detalle');
    }
  }

  private formularioDesdeCuenta(cuenta: Cuenta): FormularioCuenta {
    return {
      numeroCuenta: String(cuenta.numeroCuenta),
      nombre: cuenta.nombre,
      cuentaMaestro: String(cuenta.cuentaMaestro ?? 0),
      transfiere: cuenta.transfiere,
      movimientoStock: cuenta.movimientoStock,
      ventas: cuenta.ventas,
      compras: cuenta.compras,
      gastos: cuenta.gastos,
    };
  }

  private validar(): string | null {
    if (this.modo() === 'crear') {
      const codigo = this.formulario.numeroCuenta.trim();
      if (!/^[0-9]{1,8}$/.test(codigo) || Number(codigo) === 0) {
        return 'El código debe tener entre 1 y 8 dígitos y ser distinto de cero.';
      }
    }
    if (!this.formulario.nombre.trim()) {
      return 'Ingresá el nombre de la cuenta.';
    }
    if (this.formulario.nombre.trim().length > 200) {
      return 'El nombre no puede superar los 200 caracteres.';
    }
    return null;
  }
}
