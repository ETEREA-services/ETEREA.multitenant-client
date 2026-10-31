/** Modelos de ejercicios económicos (`ejercicios`). */

export type EstadoEjercicio = 'FUTURO' | 'EN_CURSO' | 'FINALIZADO';

export interface Ejercicio {
  ejercicioId: number;
  nombre: string;
  /** Fecha ISO `yyyy-MM-dd`. */
  fechaInicio: string;
  /** Fecha ISO `yyyy-MM-dd`. */
  fechaFin: string;
  bloqueado: boolean;
  estado: EstadoEjercicio;
  created?: string | null;
}

export interface EjercicioInput {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
}

export type OrigenSugerencia = 'SIN_EJERCICIOS' | 'ULTIMO_EJERCICIO';

export interface SiguienteEjercicio {
  disponible: boolean;
  nombre?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  origen?: OrigenSugerencia | null;
  motivo?: string | null;
}

/** Códigos de error de negocio que expone el backend en `ProblemDetail.codigo`. */
export type CodigoErrorEjercicio =
  | 'EJERCICIO_NO_EXISTE'
  | 'EJERCICIO_NOMBRE_REQUERIDO'
  | 'EJERCICIO_NOMBRE_INVALIDO'
  | 'EJERCICIO_FECHAS_REQUERIDAS'
  | 'EJERCICIO_FECHAS_INVALIDAS'
  | 'EJERCICIO_SOLAPADO'
  | 'EJERCICIO_CON_MOVIMIENTOS'
  | 'EJERCICIO_NO_ES_ULTIMO'
  | 'EJERCICIO_YA_COMENZO'
  | 'EJERCICIO_SIN_PERMISO'
  | 'EJERCICIO_BLOQUEADO';
