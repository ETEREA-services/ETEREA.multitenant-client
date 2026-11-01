import { Component, input, output } from '@angular/core';
import { ReporteDatos } from '@eterea/reporte-shared';
import {
  EtEmptyStateComponent,
  EtIconComponent,
  EtPageHeaderComponent,
  IconName,
} from '@eterea/ui-layout';
import { EtReportePreviewComponent } from '../reporte-preview/reporte-preview';

/**
 * Shell reutilizable de reportes: cabecera, acciones, estados y vista previa.
 *
 * La página de cada reporte sólo aporta los filtros (slot
 * `[reporteFiltros]`) y conecta los eventos con su repository.
 */
@Component({
  selector: 'et-reporte-layout',
  imports: [
    EtPageHeaderComponent,
    EtIconComponent,
    EtEmptyStateComponent,
    EtReportePreviewComponent,
  ],
  templateUrl: './reporte-layout.html',
  styleUrl: './reporte-layout.css',
})
export class EtReporteLayoutComponent {
  readonly eyebrow = input('Informes');
  readonly titulo = input.required<string>();
  readonly descripcion = input('');
  readonly datos = input<ReporteDatos | null>(null);
  readonly cargando = input(false);
  readonly error = input<string | null>(null);
  readonly sinPermiso = input(false);
  readonly descargando = input(false);
  readonly exportando = input(false);
  readonly mostrarExportarXlsx = input(false);
  readonly tituloVacio = input('El reporte está vacío');
  readonly descripcionVacio = input('No hay datos para los filtros seleccionados.');
  readonly iconoVacio = input<IconName>('file');

  readonly actualizar = output<void>();
  readonly reintentar = output<void>();
  readonly descargar = output<void>();
  readonly imprimir = output<void>();
  readonly exportar = output<void>();
}
