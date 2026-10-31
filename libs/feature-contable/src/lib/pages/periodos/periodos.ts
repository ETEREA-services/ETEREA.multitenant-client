import { Component } from '@angular/core';
import { EtEmptyStateComponent, EtPageHeaderComponent } from '@eterea/ui-layout';

@Component({
  selector: 'et-contable-periodos',
  imports: [EtPageHeaderComponent, EtEmptyStateComponent],
  template: `
    <et-page-header
      eyebrow="Administración"
      title="Períodos"
      description="Estado de apertura y cierre de los períodos del ejercicio."
    />
    <div class="et-card">
      <et-empty-state
        icon="calendar"
        title="Todavía no hay períodos"
        description="Los períodos del ejercicio se van a listar acá, con su estado y las acciones de cierre."
      />
    </div>
  `,
})
export class PeriodosPageComponent {}
