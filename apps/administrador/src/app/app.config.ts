import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import {
  API_URL,
  AUTH_REPOSITORY,
  AuthHttpRepository,
  authInterceptor,
  provideAppEnvInfo,
  provideSessionConfig,
} from '@eterea/shared-api';
import {
  ADMINISTRADOR_REPOSITORY,
  AdministradorHttpRepository,
} from '@eterea/administrador-data-access';
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      appRoutes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: API_URL, useValue: environment.apiUrl },
    { provide: AUTH_REPOSITORY, useClass: AuthHttpRepository },
    { provide: ADMINISTRADOR_REPOSITORY, useClass: AdministradorHttpRepository },
    provideSessionConfig({
      app: 'administrador',
      appName: 'administrador',
      homePath: '/',
      requiresAdmin: true,
      usesTenants: false,
      authApiUrl: environment.authApiUrl,
    }),
    provideAppEnvInfo({
      name: environment.env,
      version: environment.version,
      appName: 'Administrador',
    }),
  ],
};
