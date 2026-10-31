import { Component } from '@angular/core';
import { EtEmptyStateComponent, EtPageHeaderComponent } from '@eterea/ui-layout';

@Component({
  selector: 'et-contable-centros-costo',
  imports: [EtPageHeaderComponent, EtEmptyStateComponent],
  template: `
    <et-page-header
      eyebrow="Administración"
      title="Centros de costo"
      description="Estructura de centros, responsables y ejecución presupuestaria."
    />
    <div class="et-card">
      <et-empty-state
        icon="layers"
        title="Todavía no hay centros de costo"
        description="Los centros de costo de la empresa se van a administrar acá, junto con su presupuesto y ejecución."
      />
    </div>
  `,
})
export class CentrosCostoPageComponent {}
