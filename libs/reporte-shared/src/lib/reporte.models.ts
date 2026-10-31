/**
 * Contrato genérico de reportes.
 *
 * El backend envía el mismo objeto para la vista previa (JSON) y para el PDF.
 * La UI no calcula jerarquía ni formato: sólo dibuja lo que recibe.
 */

export type ReporteAlineacion = 'izquierda' | 'derecha' | 'centro';

export interface ReporteColumna {
  clave: string;
  titulo: string;
  alineacion: ReporteAlineacion;
  anchoRelativo: number;
  admiteSangria: boolean;
}

export interface ReporteFila {
  nivel: number;
  negrita: boolean;
  celdas: readonly string[];
}

export interface ReporteDatos {
  codigo: string;
  titulo: string;
  negocio: string;
  /** Fecha de generación en formato `dd-MM-yyyy`. */
  generadoEn: string;
  columnas: readonly ReporteColumna[];
  filas: readonly ReporteFila[];
  totalFilas: number;
}
