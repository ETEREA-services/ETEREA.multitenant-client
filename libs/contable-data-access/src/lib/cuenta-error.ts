import { HttpErrorResponse } from '@angular/common/http';
import { CodigoErrorCuenta } from './cuenta.models';

/** Error ya traducido a un mensaje accionable para la pantalla. */
export interface CuentaApiError {
  codigo: CodigoErrorCuenta | null;
  detail: string | null;
  status: number;
  mensaje: string;
}

const MENSAJES: Record<CodigoErrorCuenta, string> = {
  CUENTA_CODIGO_INVALIDO:
    'El código de cuenta no es válido. Usá entre 1 y 8 dígitos, distinto de cero.',
  CUENTA_NOMBRE_REQUERIDO: 'Ingresá el nombre de la cuenta.',
  CUENTA_NOMBRE_INVALIDO: 'El nombre de la cuenta supera el máximo de 200 caracteres.',
  CUENTA_MAESTRO_INVALIDA: 'La cuenta maestra no es válida.',
  CUENTA_NO_EXISTE: 'La cuenta ya no existe. Actualizá el listado.',
  CUENTA_YA_EXISTE: 'Ya existe una cuenta con ese código en este negocio.',
  CUENTA_PADRE_FALTANTE:
    'Falta una cuenta padre de la jerarquía. Creá los niveles superiores antes de esta cuenta.',
  CUENTA_PADRE_CON_MOVIMIENTOS:
    'Una cuenta padre de la jerarquía ya tiene movimientos y no admite nuevas subcuentas.',
  CUENTA_CON_HIJOS: 'No se puede eliminar: la cuenta tiene subcuentas.',
  CUENTA_CON_MOVIMIENTOS: 'No se puede eliminar: la cuenta tiene movimientos registrados.',
  CUENTA_CODIGO_INMUTABLE: 'El código de la cuenta no se puede modificar.',
  CUENTA_SIN_PERMISO: 'No tenés permiso para realizar esta acción.',
};

function esCodigoConocido(valor: string): valor is CodigoErrorCuenta {
  return Object.prototype.hasOwnProperty.call(MENSAJES, valor);
}

function leerProblemDetail(error: HttpErrorResponse): {
  codigo: CodigoErrorCuenta | null;
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
 * Traduce un error HTTP del plan de cuentas usando `codigo` y, como respaldo,
 * `detail`, el status y un mensaje genérico.
 */
export function normalizarErrorCuenta(error: unknown): CuentaApiError {
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
    return {
      codigo: null,
      detail,
      status,
      mensaje: MENSAJES.CUENTA_SIN_PERMISO,
    };
  }

  if (status === 404) {
    return { codigo: null, detail, status, mensaje: MENSAJES.CUENTA_NO_EXISTE };
  }

  if (status === 409) {
    return {
      codigo: null,
      detail,
      status,
      mensaje: detail ?? 'La operación entra en conflicto con el estado actual de la cuenta.',
    };
  }

  return {
    codigo: null,
    detail,
    status,
    mensaje: detail ?? 'No pudimos completar la operación. Intentá nuevamente.',
  };
}
