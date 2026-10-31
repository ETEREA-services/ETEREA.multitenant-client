/**
 * Generación del tenantId de un negocio.
 *
 * Reproduce el formato del tenant existente en `eterea-brain`:
 *
 *   TSA_tenant_20260709_ba1bfc4e8e1624e67c7c90b23a1b4d8e7953
 *
 * `<PREFIJO>_tenant_<YYYYMMDD>_<36 hex>`
 *
 * - El prefijo son las iniciales del nombre de la empresa (3 caracteres).
 * - La fecha es la del alta del negocio.
 * - El sufijo son 18 bytes aleatorios en hexadecimal (36 caracteres).
 *
 * La columna `negocio.tenant_id` es `varchar(60)`, por eso el prefijo se
 * recorta a 3 caracteres: 3 + 7 + 8 + 1 + 36 = 55.
 */

const LARGO_PREFIJO = 3;
const BYTES_SUFIJO = 18;
const PREFIJO_POR_DEFECTO = 'TEN';

/** Normaliza un texto a mayúsculas sin tildes ni signos. */
function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

/**
 * Iniciales del nombre de la empresa.
 *
 * Toma la primera letra de cada palabra y expande las siglas cortas en
 * mayúscula (SA, SRL, SAS, LTDA). Ejemplos:
 *   "Termalia SA"  -> "TSA"
 *   "Termalia"     -> "TER"
 *   "Acme SRL"     -> "ASR"
 */
export function prefijoTenantId(nombreEmpresa: string): string {
  const original = (nombreEmpresa ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  if (!original) {
    return PREFIJO_POR_DEFECTO;
  }

  const palabrasOriginales = original.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const palabras = palabrasOriginales.map((palabra) => normalizar(palabra));

  let sigla = '';
  for (let indice = 0; indice < palabras.length; indice++) {
    const palabra = palabras[indice]!;
    const palabraOriginal = palabrasOriginales[indice]!;
    const esSigla =
      /^[A-Z0-9]{2,4}$/.test(palabra) && palabraOriginal === palabraOriginal.toUpperCase();
    sigla += esSigla ? palabra : palabra.charAt(0);
    if (sigla.length >= LARGO_PREFIJO) {
      break;
    }
  }

  const recortada = sigla.slice(0, LARGO_PREFIJO);
  if (recortada.length >= LARGO_PREFIJO) {
    return recortada;
  }
  if (palabras.length === 1) {
    return palabras[0]!.slice(0, LARGO_PREFIJO).padEnd(LARGO_PREFIJO, 'X');
  }
  return recortada.padEnd(LARGO_PREFIJO, 'X');
}

/** Devuelve la fecha local en formato `YYYYMMDD`. */
export function fechaTenantId(fecha: Date = new Date()): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}${mes}${dia}`;
}

/** Genera 18 bytes aleatorios en hexadecimal (36 caracteres). */
export function sufijoTenantId(): string {
  const bytes = new Uint8Array(BYTES_SUFIJO);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Genera un tenantId a partir del nombre de la empresa.
 *
 * Permite fijar la fecha y el sufijo para que la vista previa del formulario
 * sea estable mientras se escribe o se cambia la empresa.
 */
export function generarTenantId(
  nombreEmpresa: string,
  fecha: Date = new Date(),
  sufijo: string = sufijoTenantId(),
): string {
  return `${prefijoTenantId(nombreEmpresa)}_tenant_${fechaTenantId(fecha)}_${sufijo}`;
}
