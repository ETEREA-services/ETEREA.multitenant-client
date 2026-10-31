import { Component, ElementRef, inject, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { EtIconComponent, IconName } from '../icon/icon';
import { EtShellContextComponent } from './shell-context';
import { ThemeService } from '../theme.service';

export interface ShellNavItem {
  label: string;
  path: string;
  icon: IconName;
  exact?: boolean;
}

export interface ShellNavGroup {
  label: string;
  items: ReadonlyArray<ShellNavItem>;
}

@Component({
  selector: 'et-shell',
  imports: [RouterLink, RouterLinkActive, EtIconComponent, EtShellContextComponent],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
  host: {
    '(document:keydown.escape)': 'cerrarMenu()',
    '(document:click)': 'cerrarMenuUsuarioFuera($event)',
  },
})
export class EtShellComponent {
  protected readonly theme = inject(ThemeService);
  private readonly host = inject(ElementRef);

  readonly appName = input('contable');
  readonly showTenant = input(true);
  readonly navGroups = input<ReadonlyArray<ShellNavGroup>>([]);
  readonly empresaName = input('Sin empresa');
  readonly negocioName = input('Elegí un negocio');
  readonly tenantInitials = input('ET');
  readonly tenantColor = input<string | null>(null);
  readonly userName = input('Invitado');
  readonly userRole = input('Sin sesión');
  readonly userInitials = input('··');
  readonly envLabel = input('LOCAL');

  readonly openContext = output<void>();
  readonly changePassword = output<void>();
  readonly logout = output<void>();

  protected readonly menuAbierto = signal(false);
  protected readonly menuUsuarioAbierto = signal(false);

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
    this.menuUsuarioAbierto.set(false);
  }

  protected alternarMenuUsuario(): void {
    this.menuUsuarioAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenuUsuario(): void {
    this.menuUsuarioAbierto.set(false);
  }

  protected cerrarMenuUsuarioFuera(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.querySelector('.et-user')?.contains(target)) {
      this.menuUsuarioAbierto.set(false);
    }
  }
}
