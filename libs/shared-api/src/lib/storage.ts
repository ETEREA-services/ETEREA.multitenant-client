export function leerStorage<T>(clave: string, porDefecto: T): T {
  if (typeof localStorage === 'undefined') {
    return porDefecto;
  }
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? (JSON.parse(crudo) as T) : porDefecto;
  } catch {
    return porDefecto;
  }
}

export function escribirStorage(clave: string, valor: unknown): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // La app sigue funcionando en memoria si el storage está bloqueado.
  }
}

export function borrarStorage(clave: string): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(clave);
  } catch {
    // Sin acción.
  }
}

function almacenSesion(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Lee de `sessionStorage`. A diferencia de `localStorage`, el almacenamiento de
 * sesión es propio de cada solapa: dos pestañas pueden operar con contextos
 * distintos y sobrevive a una recarga (F5).
 */
export function leerSesion<T>(clave: string, porDefecto: T): T {
  const storage = almacenSesion();
  if (!storage) {
    return porDefecto;
  }
  try {
    const crudo = storage.getItem(clave);
    return crudo ? (JSON.parse(crudo) as T) : porDefecto;
  } catch {
    return porDefecto;
  }
}

export function escribirSesion(clave: string, valor: unknown): void {
  const storage = almacenSesion();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(clave, JSON.stringify(valor));
  } catch {
    // La app sigue funcionando en memoria si el storage está bloqueado.
  }
}

export function borrarSesion(clave: string): void {
  const storage = almacenSesion();
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(clave);
  } catch {
    // Sin acción.
  }
}
