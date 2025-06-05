import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { NgIcon, provideIcons } from '@ng-icons/core'
import { iconoirEmojiTalkingHappy } from '@ng-icons/iconoir'

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, RouterLink, HlmIconDirective,NgIcon],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({iconoirEmojiTalkingHappy})],
})
export class AuthLayoutComponent{}
