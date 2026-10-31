/** Modelos de coeficientes de inflación (`coeficiente_inflacion`). */

export interface CoeficienteMensual {
  mes: number;
  /** `null` significa que el mes todavía no fue cargado. */
  coeficiente: number | null;
  cargado: boolean;
  coeficienteInflacionId: number | null;
  created: string | null;
}

export interface CoeficienteInflacionAnio {
  anho: number;
  meses: readonly CoeficienteMensual[];
  cargados: number;
  total: number;
}

export interface CoeficienteMensualInput {
  mes: number;
  /** `null` limpia el mes. */
  coeficiente: number | null;
}

export interface CoeficienteInflacionAnioInput {
  meses: readonly CoeficienteMensualInput[];
}

/** Códigos de error de negocio que expone el backend en `ProblemDetail.codigo`. */
export type CodigoErrorCoeficienteInflacion =
  | 'COEFICIENTE_ANIO_INVALIDO'
  | 'COEFICIENTE_MES_INVALIDO'
  | 'COEFICIENTE_MES_DUPLICADO'
  | 'COEFICIENTE_VALOR_INVALIDO'
  | 'COEFICIENTE_PRECISION_INVALIDA'
  | 'COEFICIENTE_SIN_CAMBIOS'
  | 'COEFICIENTE_CONFLICTO'
  | 'COEFICIENTE_SIN_PERMISO';
