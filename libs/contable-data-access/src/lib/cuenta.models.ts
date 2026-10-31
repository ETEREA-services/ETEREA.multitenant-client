/**
 * Modelos del plan de cuentas (`plancta`).
 *
 * Distintos del placeholder `CuentaContable` de `models.ts`: este modelo refleja
 * el contrato real de `/api/tenant/core/cuenta` (jerarquía derivada + flags).
 */

export interface Cuenta {
  numeroCuenta: number;
  nombre: string;
  negocioId: number;
  integra: boolean;
  transfiere: boolean;
  movimientoStock: boolean;
  cuentaMaestro: number;
  grado: number;
  grado1: number;
  grado2: number;
  grado3: number;
  grado4: number;
  padre: number;
  nivel: number;
  ventas: boolean;
  compras: boolean;
  gastos: boolean;
}

/** Alta de cuenta: `numeroCuenta` es editable. */
export interface CuentaInput {
  numeroCuenta: number;
  nombre: string;
  cuentaMaestro: number;
  transfiere: boolean;
  movimientoStock: boolean;
  ventas: boolean;
  compras: boolean;
  gastos: boolean;
}

/** Edición de cuenta: el código es inmutable y no viaja en el body. */
export interface CuentaUpdateInput {
  nombre: string;
  cuentaMaestro: number;
  transfiere: boolean;
  movimientoStock: boolean;
  ventas: boolean;
  compras: boolean;
  gastos: boolean;
}

/** Nodo del árbol devuelto por `GET /cuenta/arbol`. */
export interface CuentaNodo {
  cuenta: Cuenta;
  huerfana: boolean;
  hijos: readonly CuentaNodo[];
}

/** Códigos de error de negocio que expone el backend en `ProblemDetail.codigo`. */
export type CodigoErrorCuenta =
  | 'CUENTA_CODIGO_INVALIDO'
  | 'CUENTA_NOMBRE_REQUERIDO'
  | 'CUENTA_NOMBRE_INVALIDO'
  | 'CUENTA_MAESTRO_INVALIDA'
  | 'CUENTA_NO_EXISTE'
  | 'CUENTA_YA_EXISTE'
  | 'CUENTA_PADRE_FALTANTE'
  | 'CUENTA_PADRE_CON_MOVIMIENTOS'
  | 'CUENTA_CON_HIJOS'
  | 'CUENTA_CON_MOVIMIENTOS'
  | 'CUENTA_CODIGO_INMUTABLE'
  | 'CUENTA_SIN_PERMISO';
