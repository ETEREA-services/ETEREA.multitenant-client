/** Tipos base del dominio contable. Se completarán al implementar cada caso de uso. */

export type TipoCuenta = 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'GASTO';

export type Naturaleza = 'DEUDORA' | 'ACREEDORA';

export type EstadoAsiento = 'BORRADOR' | 'REGISTRADO' | 'ANULADO';

export type EstadoPeriodo = 'ABIERTO' | 'CERRADO' | 'FUTURO';

export interface CuentaContable {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoCuenta;
  rubro: string;
  naturaleza: Naturaleza;
  imputable: boolean;
  saldoInicial: number;
  activa: boolean;
}

export interface LineaAsiento {
  id: string;
  cuentaId: string;
  cuentaCodigo: string;
  cuentaNombre: string;
  detalle: string;
  debe: number;
  haber: number;
  centroCostoId?: string | null;
}

export interface Asiento {
  id: string;
  numero: string;
  fecha: string;
  descripcion: string;
  referencia: string;
  estado: EstadoAsiento;
  lineas: ReadonlyArray<LineaAsiento>;
  totalDebe: number;
  totalHaber: number;
}

export interface PeriodoContable {
  id: string;
  anio: number;
  mes: number;
  estado: EstadoPeriodo;
}

export interface CentroCosto {
  id: string;
  codigo: string;
  nombre: string;
  responsable: string;
  presupuesto: number;
  color: string;
}

export interface SnapshotContable {
  cuentas: ReadonlyArray<CuentaContable>;
  asientos: ReadonlyArray<Asiento>;
  periodos: ReadonlyArray<PeriodoContable>;
  centros: ReadonlyArray<CentroCosto>;
}
