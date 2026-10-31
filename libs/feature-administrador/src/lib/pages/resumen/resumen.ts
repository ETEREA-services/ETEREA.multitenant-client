import { Component } from '@angular/core';
import { EtEmptyStateComponent, EtPageHeaderComponent } from '@eterea/ui-layout';

@Component({
  selector: 'et-administrador-resumen',
  imports: [EtPageHeaderComponent, EtEmptyStateComponent],
  template: `
    <et-page-header
      eyebrow="Panel"
      title="Resumen"
      description="Una vista general de las empresas, los usuarios y las conexiones de la plataforma."
    />
    <div class="et-card">
      <et-empty-state
        icon="grid"
        title="Todavía no hay información"
        description="Acá va a vivir el estado general de la plataforma: empresas activas, usuarios y negocios conectados."
      />
    </div>
  `,
})
export class ResumenPageComponent {}
