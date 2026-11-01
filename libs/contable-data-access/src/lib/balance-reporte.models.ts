import { ReporteDatos } from '@eterea/reporte-shared';

/** Modo de presentación del balance. */
export type BalanceModo = 'ESTRUCTURA' | 'POR_CUENTA';

/**
 * Filtros del balance. Las fechas viajan en ISO (`yyyy-MM-dd`); las monedas
 * se eligen en cada reporte y, si no se envían, el backend usa ARS.
 */
export interface BalanceFiltro {
  desde: string;
  hasta: string;
  incluyeApertura: boolean;
  incluyeInflacion: boolean;
  modo: BalanceModo;
  monedaRegistroId: number;
  monedaExpresionId: number;
}

/** Moneda del catálogo del tenant. */
export interface MonedaInfo {
  monedaId: number;
  nombre: string;
  simbolo: string;
  esBase: boolean;
}

export interface MonedasResponse {
  monedas: readonly MonedaInfo[];
}

/** Alias para que la página no dependa del nombre del contrato de reportes. */
export type BalanceDatos = ReporteDatos;
