import { HttpErrorResponse } from '@angular/common/http';
import { CodigoErrorCoeficienteInflacion } from './coeficiente-inflacion.models';

/** Error ya traducido a un mensaje accionable para la pantalla. */
export interface CoeficienteInflacionApiError {
  codigo: CodigoErrorCoeficienteInflacion | null;
  detail: string | null;
  status: number;
  mensaje: string;
}

const MENSAJES: Record<CodigoErrorCoeficienteInflacion, string> = {
  COEFICIENTE_ANIO_INVALIDO: 'El año debe estar entre 1900 y 2100.',
  COEFICIENTE_MES_INVALIDO: 'El mes debe estar entre enero y diciembre.',
  COEFICIENTE_MES_DUPLICADO: 'Hay un mes repetido en la solicitud.',
  COEFICIENTE_VALOR_INVALIDO: 'El coeficiente no puede ser negativo.',
  COEFICIENTE_PRECISION_INVALIDA: 'El coeficiente admite hasta 6 decimales.',
  COEFICIENTE_SIN_CAMBIOS: 'No hay coeficientes para guardar.',
  COEFICIENTE_CONFLICTO:
    'Otro usuario guardó un coeficiente para ese mes. Recargá la pantalla.',
  COEFICIENTE_SIN_PERMISO: 'No tenés permiso para modificar los coeficientes.',
};

function esCodigoConocido(valor: string): valor is CodigoErrorCoeficienteInflacion {
  return Object.prototype.hasOwnProperty.call(MENSAJES, valor);
}

function leerProblemDetail(error: HttpErrorResponse): {
  codigo: CodigoErrorCoeficienteInflacion | null;
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
 * Traduce un error HTTP de coeficientes usando `codigo` y, como respaldo,
 * `detail`, el status y un mensaje genérico.
 */
export function normalizarErrorCoeficienteInflacion(
  error: unknown,
): CoeficienteInflacionApiError {
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
      mensaje: MENSAJES.COEFICIENTE_SIN_PERMISO,
    };
  }

  if (status === 409) {
    return {
      codigo: null,
      detail,
      status,
      mensaje: detail ?? MENSAJES.COEFICIENTE_CONFLICTO,
    };
  }

  return {
    codigo: null,
    detail,
    status,
    mensaje: detail ?? 'No pudimos completar la operación. Intentá nuevamente.',
  };
}
