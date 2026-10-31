import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ContextoStore } from './contexto.store';

/**
 * Adjunta el negocio activo a cada request. El header lleva
 * `negocio.tenantId`, no el `empresaId`; el backend valida la asignación.
 */
export const contextoInterceptor: HttpInterceptorFn = (req, next) => {
  const tenantId = inject(ContextoStore).tenantId();
  return tenantId ? next(req.clone({ setHeaders: { 'X-Tenant-Id': tenantId } })) : next(req);
};
