import { computed, Injectable, signal } from '@angular/core';
import { EmpresaContexto, NegocioContexto } from './contexto.model';
import { iniciales } from './format';
import { borrarSesion, escribirSesion, leerSesion } from './storage';

const CONTEXTO_KEY = 'eterea.contable.contexto';
const CONTEXTO_VERSION = 1;

interface ContextoGuardado {
  version: number;
  empresaId: string;
  negocioId: number;
}

/**
 * Contexto multiempresa del cliente contable.
 *
 * Mantiene la jerarquía empresa → negocio que llega desde Brain. La selección
 * se guarda en `sessionStorage` para que cada solapa sea independiente y para
 * que sobreviva a una recarga. El header `X-Tenant-Id` sale siempre de
 * `negocioActivo.tenantId`.
 */
@Injectable({ providedIn: 'root' })
export class ContextoStore {
  private readonly _empresas = signal<ReadonlyArray<EmpresaContexto>>([]);
  private readonly _empresaActiva = signal<EmpresaContexto | null>(null);
  private readonly _negocioActivo = signal<NegocioContexto | null>(null);
  private readonly _version = signal(0);

  readonly empresas = this._empresas.asReadonly();
  readonly empresaActiva = this._empresaActiva.asReadonly();
  readonly negocioActivo = this._negocioActivo.asReadonly();
  readonly negocios = computed(() => this._empresaActiva()?.negocios ?? []);
  readonly tenantId = computed(() => this._negocioActivo()?.tenantId ?? null);
  readonly hayContexto = computed(
    () => this._empresaActiva() !== null && this._negocioActivo() !== null,
  );
  readonly empresaIniciales = computed(() => iniciales(this._empresaActiva()?.nombre ?? ''));
  readonly negocioIniciales = computed(() => iniciales(this._negocioActivo()?.nombre ?? ''));

  /** Se incrementa cada vez que cambia el contexto activo. */
  readonly version = this._version.asReadonly();

  /**
   * Registra la lista disponible y restaura la selección guardada sólo si
   * empresa y negocio siguen activos y asignados. No auto-selecciona nada.
   */
  registrarContexto(empresas: ReadonlyArray<EmpresaContexto>): void {
    this._empresas.set(empresas);

    const guardado = this.leerGuardado();
    if (guardado) {
      const empresa = empresas.find((item) => item.empresaId === guardado.empresaId);
      const negocio = empresa?.negocios.find((item) => item.negocioId === guardado.negocioId);
      if (empresa && negocio) {
        this._empresaActiva.set(empresa);
        this._negocioActivo.set(negocio);
        return;
      }
    }

    // Un refresh de token vuelve a cargar la lista: conservar la selección en
    // memoria si continúa siendo válida.
    const empresaActual = this._empresaActiva();
    const negocioActual = this._negocioActivo();
    const empresaValida = empresaActual
      ? empresas.find((item) => item.empresaId === empresaActual.empresaId)
      : undefined;
    const negocioValido = empresaValida?.negocios.find(
      (item) => item.negocioId === negocioActual?.negocioId,
    );
    if (empresaValida && negocioValido) {
      this._empresaActiva.set(empresaValida);
      this._negocioActivo.set(negocioValido);
      this.escribirGuardado(empresaValida.empresaId, negocioValido.negocioId);
      return;
    }

    this.limpiarSeleccion();
  }

  /**
   * Aplica empresa + negocio en un solo paso. Si alguno no pertenece a la lista
   * disponible no se modifica nada.
   */
  commit(empresaId: string, negocioId: number): boolean {
    const empresa = this._empresas().find((item) => item.empresaId === empresaId);
    const negocio = empresa?.negocios.find((item) => item.negocioId === negocioId);
    if (!empresa || !negocio) {
      return false;
    }

    this._empresaActiva.set(empresa);
    this._negocioActivo.set(negocio);
    this.escribirGuardado(empresa.empresaId, negocio.negocioId);
    this._version.update((version) => version + 1);
    return true;
  }

  limpiar(): void {
    const teniaContexto = this.hayContexto();
    this._empresas.set([]);
    this.limpiarSeleccion();
    if (teniaContexto) {
      this._version.update((version) => version + 1);
    }
  }

  private limpiarSeleccion(): void {
    this._empresaActiva.set(null);
    this._negocioActivo.set(null);
    borrarSesion(CONTEXTO_KEY);
  }

  private escribirGuardado(empresaId: string, negocioId: number): void {
    const guardado: ContextoGuardado = {
      version: CONTEXTO_VERSION,
      empresaId,
      negocioId,
    };
    escribirSesion(CONTEXTO_KEY, guardado);
  }

  private leerGuardado(): ContextoGuardado | null {
    const guardado = leerSesion<ContextoGuardado | null>(CONTEXTO_KEY, null);
    return guardado?.version === CONTEXTO_VERSION ? guardado : null;
  }
}
