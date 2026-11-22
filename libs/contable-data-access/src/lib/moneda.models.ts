/** Moneda del catálogo del tenant. */
export interface MonedaInfo {
  monedaId: number;
  nombre: string;
  simbolo: string;
  esBase: boolean;
}

export interface MonedasResponse {
  monedas: readonly MonedaInfo[];
}
