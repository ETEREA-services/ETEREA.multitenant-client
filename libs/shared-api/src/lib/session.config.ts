import {
  EnvironmentProviders,
  InjectionToken,
  makeEnvironmentProviders,
} from '@angular/core';
import { AppModulo } from './auth.model';

export interface SessionConfig {
  app: AppModulo;
  appName: string;
  homePath: string;
  tenantPickerPath?: string;
  requiresAdmin: boolean;
  usesTenants: boolean;
  authApiUrl: string;
}

export const SESSION_CONFIG = new InjectionToken<SessionConfig>('SESSION_CONFIG');

export function provideSessionConfig(config: SessionConfig): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: SESSION_CONFIG, useValue: config }]);
}
