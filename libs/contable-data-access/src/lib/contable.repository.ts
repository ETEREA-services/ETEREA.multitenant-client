import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { SnapshotContable } from './models';

/**
 * Contrato de acceso a datos del módulo contable.
 *
 * La implementación HTTP se agrega en el próximo paso; la UI sólo depende de
 * este contrato para poder testearse con dobles.
 */
export interface ContableRepository {
  cargar(): Observable<SnapshotContable>;
}

export const CONTABLE_REPOSITORY = new InjectionToken<ContableRepository>('CONTABLE_REPOSITORY');
