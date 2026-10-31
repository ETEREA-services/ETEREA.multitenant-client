import { Component } from '@angular/core';
import { EtEmptyStateComponent, EtPageHeaderComponent } from '@eterea/ui-layout';

@Component({
  selector: 'et-contable-resumen',
  imports: [EtPageHeaderComponent, EtEmptyStateComponent],
  template: `
    <et-page-header
      eyebrow="Panel"
      title="Resumen"
      description="Una lectura general de la posición contable y la actividad del ejercicio."
    />
    <div class="et-card">
      <et-empty-state
        icon="grid"
        title="Todavía no hay información"
        description="Acá va a vivir el resumen del ejercicio: posición patrimonial, resultados y actividad reciente."
      />
    </div>
  `,
})
export class ResumenPageComponent {}
