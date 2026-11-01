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
  /** Tipo de dato usado por la exportación XLSX. */
  tipo?: 'TEXTO' | 'NUMERO';
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
  /** Período, monedas u otra línea de contexto debajo del título. */
  subtitulo?: string;
  columnas: readonly ReporteColumna[];
  filas: readonly ReporteFila[];
  totalFilas: number;
  /** Avisos del backend (por ejemplo, un balance que no cuadra). */
  advertencias?: readonly string[];
}
