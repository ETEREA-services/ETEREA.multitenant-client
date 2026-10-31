import { Component, input } from '@angular/core';
import { ReporteColumna, ReporteDatos, ReporteFila } from '@eterea/reporte-shared';

/**
 * Vista previa del reporte: dibuja el mismo contrato JSON que usa el PDF.
 *
 * No calcula orden, jerarquía ni formato; sólo aplica la sangría y la negrita
 * que vienen resueltas desde el backend.
 */
@Component({
  selector: 'et-reporte-preview',
  templateUrl: './reporte-preview.html',
  styleUrl: './reporte-preview.css',
})
export class EtReportePreviewComponent {
  readonly datos = input.required<ReporteDatos>();

  protected sangria(columna: ReporteColumna, fila: ReporteFila): string | null {
    if (!columna.admiteSangria) {
      return null;
    }
    const nivel = Math.max(1, fila.nivel);
    return `${0.9 + (nivel - 1) * 1.25}rem`;
  }
}
