import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import {
  API_URL,
  AUTH_REPOSITORY,
  AuthHttpRepository,
  authInterceptor,
  contextoInterceptor,
  provideAppEnvInfo,
  provideSessionConfig,
} from '@eterea/shared-api';
import {
  BALANCE_REPORTE_REPOSITORY,
  BalanceReporteHttpRepository,
  COEFICIENTE_INFLACION_REPOSITORY,
  CoeficienteInflacionHttpRepository,
  CUENTA_REPOSITORY,
  CuentaHttpRepository,
  EJERCICIO_REPOSITORY,
  EjercicioHttpRepository,
  PLAN_CUENTAS_REPORTE_REPOSITORY,
  PlanCuentasReporteHttpRepository,
} from '@eterea/contable-data-access';
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
    provideHttpClient(withInterceptors([authInterceptor, contextoInterceptor])),
    { provide: API_URL, useValue: environment.apiUrl },
    { provide: AUTH_REPOSITORY, useClass: AuthHttpRepository },
    { provide: CUENTA_REPOSITORY, useClass: CuentaHttpRepository },
    { provide: EJERCICIO_REPOSITORY, useClass: EjercicioHttpRepository },
    {
      provide: PLAN_CUENTAS_REPORTE_REPOSITORY,
      useClass: PlanCuentasReporteHttpRepository,
    },
    {
      provide: BALANCE_REPORTE_REPOSITORY,
      useClass: BalanceReporteHttpRepository,
    },
    {
      provide: COEFICIENTE_INFLACION_REPOSITORY,
      useClass: CoeficienteInflacionHttpRepository,
    },
    provideSessionConfig({
      app: 'contable',
      appName: 'contable',
      homePath: '/',
      tenantPickerPath: '/empresas',
      requiresAdmin: false,
      usesTenants: true,
      authApiUrl: environment.authApiUrl,
    }),
    provideAppEnvInfo({ name: environment.env, version: environment.version }),
  ],
};
