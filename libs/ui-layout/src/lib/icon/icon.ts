import { Component, computed, input } from '@angular/core';

const ICONOS = {
  grid: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
  book: [
    'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z',
    'M4 20.5A2.5 2.5 0 0 1 6.5 18H20',
    'M8 7h8',
    'M8 11h5',
  ],
  tree: ['M5 4v16', 'M5 9h6', 'M11 9v4', 'M11 13h6', 'M5 17h6'],
  scale: ['M12 4v16', 'M6 8h12', 'M6 8l-3 6h6z', 'M18 8l-3 6h6z', 'M8 20h8'],
  chart: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2'],
  calendar: ['M4 6h16v14H4z', 'M8 3v4', 'M16 3v4', 'M4 10h16', 'M8 14h2', 'M12 14h2', 'M16 14h2'],
  layers: ['M12 3l9 5-9 5-9-5z', 'M3 12l9 5 9-5', 'M3 16l9 5 9-5'],
  settings: ['M4 7h10', 'M18 7h2', 'M4 17h4', 'M12 17h8', 'M14 4v6', 'M8 14v6'],
  building: [
    'M5 21V4h9v17',
    'M14 9h5v12',
    'M8 8h3',
    'M8 12h3',
    'M8 16h3',
    'M17 13h1',
    'M17 17h1',
    'M3 21h18',
  ],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14', 'M20 20l-4-4'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  sun: [
    'M12 4V2',
    'M12 22v-2',
    'M4 12H2',
    'M22 12h-2',
    'M5.6 5.6L4.2 4.2',
    'M19.8 19.8l-1.4-1.4',
    'M18.4 5.6l1.4-1.4',
    'M4.2 19.8l1.4-1.4',
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
  ],
  moon: ['M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z'],
  logout: ['M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4', 'M10 8l-4 4 4 4', 'M6 12h10'],
  'chevron-right': ['M9 6l6 6-6 6'],
  'chevron-left': ['M15 6l-6 6 6 6'],
  'chevron-down': ['M6 9l6 6 6-6'],
  'arrow-right': ['M4 12h15', 'M13 6l6 6-6 6'],
  'arrow-up-right': ['M7 17L17 7', 'M8 7h9v9'],
  swap: ['M4 8h13', 'M13 4l4 4-4 4', 'M20 16H7', 'M11 12l-4 4 4 4'],
  inbox: ['M4 4h16v16H4z', 'M4 14h4l2 3h4l2-3h4'],
  plus: ['M12 5v14', 'M5 12h14'],
  alert: ['M12 4l9 16H3z', 'M12 10v4', 'M12 17h.01'],
  user: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M4 21a8 8 0 0 1 16 0'],
  spark: [
    'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
    'M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  ],
  check: ['M5 12l4.5 4.5L19 7'],
  copy: ['M9 9h10v10H9z', 'M5 15V5h10'],
  download: ['M12 4v11', 'M7 10l5 5 5-5', 'M4 20h16'],
  dots: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
  filter: ['M4 5h16l-6 8v6l-4 2v-8z'],
  lock: ['M6 11h12v10H6z', 'M8 11V8a4 4 0 0 1 8 0v3'],
  shield: ['M12 3l7 3v5c0 4.4-2.9 7.6-7 9-4.1-1.4-7-4.6-7-9V6z', 'M9 12l2 2 4-4'],
  wallet: ['M4 7h16v12H4z', 'M4 7l2-3h12l2 3', 'M15 13h3'],
  clock: ['M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16', 'M12 8v5l3 2'],
  file: ['M6 3h8l4 4v14H6z', 'M14 3v5h5', 'M9 13h6', 'M9 17h6'],
  printer: [
    'M7 8V3h10v5',
    'M5 8h14v8H5z',
    'M7 16h10v5H7z',
    'M17 11h.01',
  ],
} as const;

export type IconName = keyof typeof ICONOS;

@Component({
  selector: 'et-icon',
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="grosor()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @for (trazo of trazos(); track $index) {
        <path [attr.d]="trazo" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
    }
  `,
})
export class EtIconComponent {
  readonly name = input<IconName>('grid');
  readonly size = input(20);
  readonly grosor = input(1.7);

  protected readonly trazos = computed<ReadonlyArray<string>>(
    () => ICONOS[this.name()] ?? ICONOS.grid,
  );
}
