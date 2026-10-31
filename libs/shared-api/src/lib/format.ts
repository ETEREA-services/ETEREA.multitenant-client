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

export function fecha(valor: string | Date): string {
  const fechaValor =
    valor instanceof Date
      ? valor
      : new Date(/^\d{4}-\d{2}-\d{2}$/.test(valor) ? `${valor}T00:00:00` : valor);

  if (Number.isNaN(fechaValor.getTime())) {
    return typeof valor === 'string' ? valor : '';
  }

  const dia = String(fechaValor.getDate()).padStart(2, '0');
  const mes = String(fechaValor.getMonth() + 1).padStart(2, '0');
  return `${dia}-${mes}-${fechaValor.getFullYear()}`;
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
