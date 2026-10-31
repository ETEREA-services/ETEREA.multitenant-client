import {
  EnvironmentProviders,
  InjectionToken,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';

export interface AppEnvInfo {
  name: string;
  version: string;
  /** Nombre visible de la aplicación en el título del documento. */
  appName?: string;
}

export type EnvDisplayKey = 'local' | 'develop' | 'staging' | 'production' | 'unknown';

export interface EnvDisplay {
  key: EnvDisplayKey;
  label: string;
}

export const APP_ENV_INFO = new InjectionToken<AppEnvInfo>('APP_ENV_INFO');

const ENV_DISPLAYS: Record<EnvDisplayKey, EnvDisplay> = {
  local: { key: 'local', label: 'LOCAL' },
  develop: { key: 'develop', label: 'DESARROLLO' },
  staging: { key: 'staging', label: 'STAGING' },
  production: { key: 'production', label: 'PRODUCCIÓN' },
  unknown: { key: 'unknown', label: 'SIN DEFINIR' },
};

const ENV_ALIASES: Record<string, EnvDisplayKey> = {
  local: 'local',
  localhost: 'local',
  develop: 'develop',
  dev: 'develop',
  desarrollo: 'develop',
  staging: 'staging',
  stage: 'staging',
  produccion: 'production',
  production: 'production',
  prod: 'production',
};

export function getEnvDisplay(name: string | null | undefined): EnvDisplay {
  const normalized = (name ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, '');
  return ENV_DISPLAYS[ENV_ALIASES[normalized] ?? 'unknown'];
}

export function provideAppEnvInfo(info: AppEnvInfo): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: APP_ENV_INFO, useValue: info },
    provideEnvironmentInitializer(() => {
      if (typeof document === 'undefined') {
        return;
      }
      document.title = `Eterea · ${info.appName ?? 'Contable'}`;
    }),
  ]);
}
