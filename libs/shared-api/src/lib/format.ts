const numero0 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const numero2 = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function numero(valor: number, decimales: 0 | 2 = 0): string {
  return decimales === 2 ? numero2.format(valor) : numero0.format(valor);
}

export function moneda(valor: number, simbolo = '$'): string {
  const signo = valor < 0 ? '-' : '';
  return `${signo}${simbolo} ${numero(Math.abs(valor))}`;
}

export function porcentaje(valor: number, decimales = 1): string {
  return `${valor.toFixed(decimales).replace('.', ',')}%`;
}

function dosDigitos(valor: number): string {
  return String(valor).padStart(2, '0');
}

/** Normaliza una fecha ya formateada (`dd-MM-yyyy` o `dd/MM/yyyy`) a `dd/MM/yyyy`. */
function fechaPreformateada(valor: string): string | null {
  const partes = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(valor.trim());
  if (!partes) {
    return null;
  }
  const dia = Number(partes[1]);
  const mes = Number(partes[2]);
  if (dia < 1 || dia > 31 || mes < 1 || mes > 12) {
    return null;
  }
  return `${partes[1]}/${partes[2]}/${partes[3]}`;
}

function parsearFecha(valor: string | Date): Date | null {
  const fechaValor =
    valor instanceof Date
      ? valor
      : new Date(/^\d{4}-\d{2}-\d{2}$/.test(valor) ? `${valor}T00:00:00` : valor);
  return Number.isNaN(fechaValor.getTime()) ? null : fechaValor;
}

/**
 * Fecha visible en `dd/MM/yyyy`, construida manualmente para no depender de la
 * configuración regional ni de la zona horaria del equipo.
 */
export function fecha(valor: string | Date): string {
  if (typeof valor === 'string') {
    const normalizada = fechaPreformateada(valor);
    if (normalizada) {
      return normalizada;
    }
  }

  const fechaValor = parsearFecha(valor);
  if (!fechaValor) {
    return typeof valor === 'string' ? valor : '';
  }

  const dia = dosDigitos(fechaValor.getDate());
  const mes = dosDigitos(fechaValor.getMonth() + 1);
  return `${dia}/${mes}/${fechaValor.getFullYear()}`;
}

/** Fecha y hora visibles en `dd/MM/yyyy HH:mm`, sin depender del equipo. */
export function fechaHora(valor: string | Date): string {
  const fechaValor = parsearFecha(valor);
  if (!fechaValor) {
    return fecha(valor);
  }

  const horas = dosDigitos(fechaValor.getHours());
  const minutos = dosDigitos(fechaValor.getMinutes());
  return `${fecha(fechaValor)} ${horas}:${minutos}`;
}

/** Fecha para nombres de archivo: `dd-MM-yyyy` (la barra no es válida en un nombre). */
export function fechaArchivo(valor: string | Date): string {
  return fecha(valor).replace(/\//g, '-');
}

export function mesCorto(mes: number): string {
  return new Intl.DateTimeFormat('es-AR', { month: 'short' })
    .format(new Date(2026, mes - 1, 1))
    .replace(/\./g, '');
}

/** Iniciales visibles para avatares de empresa o negocio. */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) {
    return 'ET';
  }
  const primera = partes[0]?.charAt(0) ?? '';
  const segunda = partes[1]?.charAt(0) ?? '';
  return `${primera}${segunda}`.toUpperCase() || 'ET';
}
