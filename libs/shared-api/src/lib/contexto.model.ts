/** Jerarquía empresa → negocio con la que opera el cliente contable. */

/**
 * Negocio activo de una empresa. El `tenantId` es el valor que viaja en el
 * header `X-Tenant-Id`; nunca se usa el `empresaId` para resolver el tenant.
 */
export interface NegocioContexto {
  negocioId: number;
  empresaId: string;
  nombre: string;
  tenantId: string;
}

/** Empresa asignada al usuario con sus negocios activos. */
export interface EmpresaContexto {
  empresaId: string;
  nombre: string;
  negocios: ReadonlyArray<NegocioContexto>;
}

/** Selección atómica empresa + negocio. */
export interface ContextoSeleccion {
  empresaId: string;
  negocioId: number;
}
