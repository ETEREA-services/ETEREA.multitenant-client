import { ReporteDatos } from '@eterea/reporte-shared';

/**
 * Filtros del Mayor de una cuenta. Las fechas viajan en ISO (`yyyy-MM-dd`);
 * las monedas se eligen por reporte y, si no se envían, el backend usa ARS.
 */
export interface MayorFiltro {
  cuenta: number;
  desde: string;
  hasta: string;
  sinSaldoAnterior: boolean;
  monedaRegistroId: number;
  monedaExpresionId: number;
}

export interface MayorDiscriminadoFiltro {
  cuentas: readonly number[];
  desde: string;
  hasta: string;
  monedaRegistroId: number;
  monedaExpresionId: number;
}

export interface MayorModulo {
  moduloId: number;
  nombre: string;
  cantidad: number;
}

/** Controles operativos que devuelve el backend junto con el reporte. */
export interface MayorControl {
  totalMovimientos: number;
  movimientosExcluidos: number;
  modulos: readonly MayorModulo[];
  comprobantesSinTipo: readonly number[];
}

/** Respuesta de `POST /reporte/mayor/datos`. */
export interface MayorDatos {
  reporte: ReporteDatos;
  control: MayorControl;
}

/** El Discriminado devuelve directamente el contrato de reporte. */
export type MayorDiscriminadoDatos = ReporteDatos;
