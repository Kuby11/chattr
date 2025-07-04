import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmFormFieldModule } from '@spartan-ng/ui-formfield-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';

import { HideButton } from '../../features/hide-button/hide-button.component';
import { RouterLink } from '@angular/router';
import { FormType } from '../../layouts/auth-layout/types';
import { AuthResponseInterface } from '../../features/auth/interfaces';
import { AuthService } from '../../features/auth/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [
    HlmButtonDirective,
    ReactiveFormsModule,
    HlmFormFieldModule,
    HlmInputDirective,
    HideButton,
    RouterLink,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  passwordVisible = signal(true);
  message = signal<AuthResponseInterface | null>(null);


  getState(value: boolean) {
    this.passwordVisible.set(value);
  }

  registerForm = this.fb.nonNullable.group({
    displayName: ['', Validators.required],
    username: ['', Validators.required],
    email: ['', Validators.required, Validators.email],
    password: ['', Validators.required, Validators.minLength(8)],
  });

  onSubmit() {
    if (this.form.valid) {
      // @ts-ignore
      this.authService.register(this.form.value)
      .subscribe((data)=> {
        this.message.set(data as AuthResponseInterface);
      })
      //@ts-ignore
      this.authService.login(this.form.value).subscribe()
    }
  }
  form: FormType = this.fb.nonNullable.group({
    username: [
      '',
      [
        Validators.required, 
        Validators.minLength(3), 
        Validators.maxLength(24), 
        Validators.pattern('^[A-Za-z0-9._-]+$')
      ],
    ],
    email: [
      '',
      [Validators.required, Validators.email, Validators.maxLength(258)],
    ],
    password: ['', [Validators.required]],
  });
}
