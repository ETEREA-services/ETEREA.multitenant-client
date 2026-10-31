import { HttpErrorResponse } from '@angular/common/http';
import { CodigoErrorEjercicio } from './ejercicio.models';

/** Error ya traducido a un mensaje accionable para la pantalla. */
export interface EjercicioApiError {
  codigo: CodigoErrorEjercicio | null;
  detail: string | null;
  status: number;
  mensaje: string;
}

const MENSAJES: Record<CodigoErrorEjercicio, string> = {
  EJERCICIO_NO_EXISTE: 'El ejercicio ya no existe. Actualizá el listado.',
  EJERCICIO_NOMBRE_REQUERIDO: 'Ingresá el nombre del ejercicio.',
  EJERCICIO_NOMBRE_INVALIDO: 'El nombre no puede superar los 128 caracteres.',
  EJERCICIO_FECHAS_REQUERIDAS: 'Ingresá la fecha de inicio y la fecha de fin.',
  EJERCICIO_FECHAS_INVALIDAS: 'La fecha de inicio no puede ser posterior a la fecha de fin.',
  EJERCICIO_SOLAPADO: 'El ejercicio se superpone con otro existente. Revisá las fechas.',
  EJERCICIO_CON_MOVIMIENTOS:
    'El ejercicio tiene movimientos; no se pueden cambiar sus fechas ni eliminarlo.',
  EJERCICIO_NO_ES_ULTIMO: 'Sólo se puede eliminar el último ejercicio.',
  EJERCICIO_YA_COMENZO: 'Sólo se puede eliminar un ejercicio que todavía no comenzó.',
  EJERCICIO_SIN_PERMISO: 'No tenés permiso para realizar esta acción.',
  EJERCICIO_BLOQUEADO: 'El ejercicio está bloqueado y no admite movimientos en ese período.',
};

function esCodigoConocido(valor: string): valor is CodigoErrorEjercicio {
  return Object.prototype.hasOwnProperty.call(MENSAJES, valor);
}

function leerProblemDetail(error: HttpErrorResponse): {
  codigo: CodigoErrorEjercicio | null;
  detail: string | null;
} {
  const body: unknown = error.error;
  if (typeof body !== 'object' || body === null) {
    return { codigo: null, detail: null };
  }

  const registro = body as Record<string, unknown>;
  const codigo = typeof registro['codigo'] === 'string' ? registro['codigo'] : null;
  const detail = typeof registro['detail'] === 'string' ? registro['detail'] : null;
  const title = typeof registro['title'] === 'string' ? registro['title'] : null;

  return {
    codigo: codigo && esCodigoConocido(codigo) ? codigo : null,
    detail: detail ?? title,
  };
}

/**
 * Traduce un error HTTP de ejercicios usando `codigo` y, como respaldo,
 * `detail`, el status y un mensaje genérico.
 */
export function normalizarErrorEjercicio(error: unknown): EjercicioApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return {
      codigo: null,
      detail: null,
      status: 0,
      mensaje: 'No pudimos completar la operación. Intentá nuevamente.',
    };
  }

  const { codigo, detail } = leerProblemDetail(error);
  const status = error.status;

  if (codigo) {
    return { codigo, detail, status, mensaje: MENSAJES[codigo] };
  }

  if (status === 0) {
    return {
      codigo: null,
      detail,
      status,
      mensaje: 'No pudimos conectar con el servidor. Revisá tu conexión.',
    };
  }

  if (status === 401) {
    return {
      codigo: null,
      detail,
      status,
      mensaje: 'La sesión expiró. Volvé a ingresar.',
    };
  }

  if (status === 403) {
    return { codigo: null, detail, status, mensaje: MENSAJES.EJERCICIO_SIN_PERMISO };
  }

  if (status === 404) {
    return { codigo: null, detail, status, mensaje: MENSAJES.EJERCICIO_NO_EXISTE };
  }

  if (status === 409) {
    return {
      codigo: null,
      detail,
      status,
      mensaje: detail ?? 'La operación entra en conflicto con el estado actual.',
    };
  }

  return {
    codigo: null,
    detail,
    status,
    mensaje: detail ?? 'No pudimos completar la operación. Intentá nuevamente.',
  };
}
