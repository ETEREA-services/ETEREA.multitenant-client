import { InjectionToken } from '@angular/core';

/** Base de la API de Eterea, sin `/` final. Se provee desde el host. */
export const API_URL = new InjectionToken<string>('API_URL');
