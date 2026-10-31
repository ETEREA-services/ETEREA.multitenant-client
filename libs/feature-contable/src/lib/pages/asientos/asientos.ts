import { Component } from '@angular/core';
import { EtEmptyStateComponent, EtPageHeaderComponent } from '@eterea/ui-layout';

@Component({
  selector: 'et-contable-asientos',
  imports: [EtPageHeaderComponent, EtEmptyStateComponent],
  template: `
    <et-page-header
      eyebrow="Registros"
      title="Asientos"
      description="Los asientos del ejercicio con su estado, fecha y totales."
    />
    <div class="et-card">
      <et-empty-state
        icon="book"
        title="Todavía no hay asientos"
        description="El listado de asientos se va a mostrar acá, con filtros por período, estado y búsqueda."
      />
    </div>
  `,
})
export class AsientosPageComponent {}
