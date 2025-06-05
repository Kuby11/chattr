import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmFormFieldModule } from '@spartan-ng/ui-formfield-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HideButton } from '../../../features/hide-button/hide-button.component';
import { RouterLink } from '@angular/router';


import { AuthService } from '../../../auth/services/auth.service';
import { FormType } from '../types';
import { AuthResponseInterface } from '../../../auth/interfaces';

@Component({
  selector: 'app-login',
  imports: [
    HlmButtonDirective,
    ReactiveFormsModule,
    HlmFormFieldModule,
    HlmInputDirective,
    HideButton,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  
  message = signal<AuthResponseInterface | null>(null);
  passwordVisible = signal(true);


  getState(value: boolean) {
    this.passwordVisible.set(value);
  }

  onSubmit() {
    if (this.form.valid) {
      // @ts-ignore
      this.authService.login(this.form.value)
        .subscribe((data)=> {
          this.message.set(data as AuthResponseInterface);
        })
    }
  }

  form: FormType = this.fb.nonNullable.group({
    username: [
      'saba',
      [
        Validators.required, 
        Validators.minLength(3), 
        Validators.maxLength(24), 
        Validators.pattern('^[A-Za-z0-9._-]+$')
      ],
    ],
    email: [
      'saba@gmail.com',
      [Validators.required, Validators.email, Validators.maxLength(258)],
    ],
    password: ['sabasaba11', [Validators.required]],
  });
}
