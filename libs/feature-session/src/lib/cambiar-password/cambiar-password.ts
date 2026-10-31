import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '@eterea/shared-api';
import { EtIconComponent, EtPageHeaderComponent } from '@eterea/ui-layout';

/** La nueva contraseña debe ser distinta de la actual y coincidir con su repetición. */
function passwordsValidator(group: AbstractControl): ValidationErrors | null {
  const actual = group.get('currentPassword')?.value ?? '';
  const nueva = group.get('newPassword')?.value ?? '';
  const repetir = group.get('confirmPassword')?.value ?? '';
  const errores: ValidationErrors = {};

  if (nueva && actual && nueva === actual) {
    errores['mismaPassword'] = true;
  }
  if (nueva && repetir && nueva !== repetir) {
    errores['noCoincide'] = true;
  }

  return Object.keys(errores).length > 0 ? errores : null;
}

@Component({
  selector: 'et-cambiar-password',
  imports: [ReactiveFormsModule, EtIconComponent, EtPageHeaderComponent],
  templateUrl: './cambiar-password.html',
  styleUrl: './cambiar-password.css',
})
export class CambiarPasswordComponent {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly cambioObligatorio = this.auth.passwordChangeRequired;
  protected readonly vencimientoTemporal = computed(
    () => this.auth.usuario()?.temporaryPasswordExpiresAt ?? null,
  );

  protected readonly form = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsValidator },
  );

  protected enviar(): void {
    if (this.form.invalid || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    const { currentPassword, newPassword } = this.form.getRawValue();
    this.auth.cambiarPassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        void this.router.navigate(['/login'], {
          queryParams: { passwordChanged: '1' },
        });
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.error.set(this.mensajeError(error));
      },
    });
  }

  protected volver(): void {
    void this.router.navigateByUrl('/');
  }

  protected formatearVencimiento(valor: string): string {
    return new Date(valor).toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return 'La contraseña actual no es correcta.';
      }
      if (error.status === 400) {
        return 'Revisá los datos ingresados.';
      }
      if (error.status === 0) {
        return 'No pudimos conectar con el servidor.';
      }
    }
    return 'No pudimos cambiar la contraseña. Intentá nuevamente.';
  }
}
