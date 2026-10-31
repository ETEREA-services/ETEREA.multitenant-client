import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import {
  ADMINISTRADOR_REPOSITORY,
  PasswordTemporal,
  Usuario,
} from '@eterea/administrador-data-access';
import { EtEmptyStateComponent, EtIconComponent, EtPageHeaderComponent } from '@eterea/ui-layout';

interface FormularioUsuario {
  login: string;
  nombre: string;
  email: string;
  password: string;
  activo: boolean;
  administrador: boolean;
}

const FORMULARIO_USUARIO_VACIO: FormularioUsuario = {
  login: '',
  nombre: '',
  email: '',
  password: '',
  activo: true,
  administrador: false,
};

@Component({
  selector: 'et-administrador-usuarios',
  imports: [FormsModule, EtPageHeaderComponent, EtEmptyStateComponent, EtIconComponent],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class UsuariosPageComponent implements OnInit {
  private readonly repository = inject(ADMINISTRADOR_REPOSITORY);
  private readonly router = inject(Router);

  protected readonly usuarios = signal<ReadonlyArray<Usuario>>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly seleccionado = signal<Usuario | null>(null);
  protected readonly generando = signal(false);
  protected readonly resultado = signal<PasswordTemporal | null>(null);
  protected readonly errorDialogo = signal<string | null>(null);
  protected readonly copiado = signal(false);

  protected readonly altaAbierta = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorAlta = signal<string | null>(null);
  protected readonly formulario: FormularioUsuario = { ...FORMULARIO_USUARIO_VACIO };

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.repository
      .cargarUsuarios()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (usuarios) => this.usuarios.set(this.ordenar(usuarios)),
        error: (error: unknown) => this.error.set(this.mensajeError(error)),
      });
  }

  protected verAsignaciones(usuario: Usuario): void {
    void this.router.navigate(['/asignaciones', usuario.usuarioId]);
  }

  protected abrirAlta(): void {
    Object.assign(this.formulario, FORMULARIO_USUARIO_VACIO);
    this.errorAlta.set(null);
    this.altaAbierta.set(true);
  }

  protected cerrarAlta(): void {
    if (this.guardando()) {
      return;
    }
    this.altaAbierta.set(false);
    this.errorAlta.set(null);
  }

  protected crear(): void {
    if (this.guardando()) {
      return;
    }

    const login = this.formulario.login.trim();
    const nombre = this.formulario.nombre.trim();
    const email = this.formulario.email.trim();
    const password = this.formulario.password;

    if (!login || !nombre || !email || !password) {
      this.errorAlta.set('Completá login, nombre, email y contraseña.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.errorAlta.set('Ingresá un email válido.');
      return;
    }
    if (password.length < 8) {
      this.errorAlta.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (this.usuarios().some((usuario) => usuario.login.toLowerCase() === login.toLowerCase())) {
      this.errorAlta.set('Ya existe un usuario con ese login.');
      return;
    }
    if (this.usuarios().some((usuario) => usuario.email?.toLowerCase() === email.toLowerCase())) {
      this.errorAlta.set('Ya existe un usuario con ese email.');
      return;
    }

    this.guardando.set(true);
    this.errorAlta.set(null);

    this.repository
      .crearUsuario({
        login,
        nombre,
        email,
        password,
        activo: this.formulario.activo,
        administrador: this.formulario.administrador,
      })
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: (usuario) => {
          this.usuarios.update((lista) => this.ordenar([...lista, usuario]));
          this.altaAbierta.set(false);
          Object.assign(this.formulario, FORMULARIO_USUARIO_VACIO);
        },
        error: (error: unknown) => this.errorAlta.set(this.mensajeErrorAlta(error)),
      });
  }

  protected pedirConfirmacion(usuario: Usuario): void {
    this.seleccionado.set(usuario);
    this.resultado.set(null);
    this.errorDialogo.set(null);
    this.copiado.set(false);
  }

  protected confirmar(): void {
    const usuario = this.seleccionado();
    if (!usuario || this.generando()) {
      return;
    }

    this.generando.set(true);
    this.errorDialogo.set(null);

    this.repository
      .blanquearPassword(usuario.usuarioId)
      .pipe(finalize(() => this.generando.set(false)))
      .subscribe({
        next: (resultado) => {
          this.resultado.set(resultado);
          this.usuarios.update((usuarios) =>
            usuarios.map((actual) =>
              actual.usuarioId === usuario.usuarioId
                ? {
                    ...actual,
                    mustChangePassword: true,
                    temporaryPasswordExpiresAt: resultado.expiresAt,
                  }
                : actual,
            ),
          );
        },
        error: (error: unknown) => this.errorDialogo.set(this.mensajeError(error)),
      });
  }

  protected copiar(): void {
    const resultado = this.resultado();
    if (!resultado) {
      return;
    }

    this.copiado.set(false);
    void navigator.clipboard
      .writeText(resultado.temporaryPassword)
      .then(() => this.copiado.set(true))
      .catch(() => this.copiado.set(false));
  }

  protected cerrar(): void {
    if (this.generando()) {
      return;
    }
    this.seleccionado.set(null);
    this.resultado.set(null);
    this.errorDialogo.set(null);
    this.copiado.set(false);
  }

  protected iniciales(usuario: Usuario): string {
    const partes = (usuario.nombre || usuario.login).trim().split(/\s+/).filter(Boolean);
    const primera = partes[0]?.charAt(0) ?? '';
    const segunda = partes[1]?.charAt(0) ?? '';
    return `${primera}${segunda}`.toUpperCase() || 'US';
  }

  protected fecha(valor?: string | null): string {
    if (!valor) {
      return 'Nunca';
    }

    const fechaValor = new Date(valor);
    if (Number.isNaN(fechaValor.getTime())) {
      return valor;
    }

    const dia = String(fechaValor.getDate()).padStart(2, '0');
    const mes = String(fechaValor.getMonth() + 1).padStart(2, '0');
    const anio = fechaValor.getFullYear();
    const horas = String(fechaValor.getHours()).padStart(2, '0');
    const minutos = String(fechaValor.getMinutes()).padStart(2, '0');

    return `${dia}-${mes}-${anio} ${horas}:${minutos}`;
  }

  private ordenar(usuarios: ReadonlyArray<Usuario>): ReadonlyArray<Usuario> {
    return [...usuarios].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return 'No tenés permisos para blanquear contraseñas.';
      }
      if (error.status === 404) {
        return 'El usuario ya no existe. Actualizá el listado.';
      }
      if (error.status === 0) {
        return 'No pudimos conectar con el servidor.';
      }
    }
    return 'No pudimos completar la operación. Intentá nuevamente.';
  }

  private mensajeErrorAlta(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return 'No tenés permisos para dar de alta usuarios.';
      }
      if (error.status === 409) {
        return 'Ya existe un usuario con ese login o email.';
      }
      if (error.status === 400) {
        return 'Revisá los datos ingresados.';
      }
      if (error.status === 0) {
        return 'No pudimos conectar con el servidor.';
      }
    }
    return 'No pudimos crear el usuario. Intentá nuevamente.';
  }
}
