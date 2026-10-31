import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, from, mergeMap, of, throwError } from 'rxjs';

/** Error de reportes ya traducido a un mensaje accionable. */
export class ReporteApiError extends Error {
  constructor(
    readonly codigo: string | null,
    readonly status: number,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ReporteApiError';
  }
}

function mensajePara(status: number, detail: string | null): string {
  if (status === 0) {
    return 'No pudimos conectar con el servidor. Revisá tu conexión.';
  }
  if (status === 401) {
    return 'La sesión expiró. Volvé a ingresar.';
  }
  if (status === 403) {
    return 'No tenés permiso para ver el listado de este negocio.';
  }
  if (status === 404) {
    return 'El reporte solicitado no existe.';
  }
  return detail ?? 'No pudimos generar el listado. Intentá nuevamente.';
}

function leerCuerpo(cuerpo: unknown): { codigo: string | null; detail: string | null } {
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    return { codigo: null, detail: null };
  }
  const registro = cuerpo as Record<string, unknown>;
  return {
    codigo: typeof registro['codigo'] === 'string' ? registro['codigo'] : null,
    detail: typeof registro['detail'] === 'string' ? registro['detail'] : null,
  };
}

function crearError(status: number, cuerpo: unknown): ReporteApiError {
  const { codigo, detail } = leerCuerpo(cuerpo);
  return new ReporteApiError(codigo, status, mensajePara(status, detail));
}

/**
 * Normaliza errores de reportes, incluidos los que llegan como `Blob` cuando
 * la petición pidió un PDF (`responseType: 'blob'`).
 */
export function reporteErrorDesdeHttp(error: unknown): Observable<never> {
  if (!(error instanceof HttpErrorResponse)) {
    return throwError(
      () =>
        new ReporteApiError(
          null,
          0,
          'No pudimos generar el listado. Intentá nuevamente.',
        ),
    );
  }

  const cuerpo: unknown = error.error;
  if (cuerpo instanceof Blob) {
    return from(cuerpo.text()).pipe(
      catchError(() => of('')),
      mergeMap((texto) => {
        let parseado: unknown = null;
        try {
          parseado = JSON.parse(texto);
        } catch {
          parseado = null;
        }
        return throwError(() => crearError(error.status, parseado));
      }),
    );
  }

  return throwError(() => crearError(error.status, cuerpo));
}
