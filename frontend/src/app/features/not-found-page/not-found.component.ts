import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { provideIcons,NgIcon } from '@ng-icons/core'
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { iconoirEmojiSad } from '@ng-icons/iconoir'

@Component({
  selector: 'app-not-found',
  imports: [HlmButtonDirective, RouterLink, NgIcon, HlmIconDirective],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css',
  providers: [provideIcons({ iconoirEmojiSad })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent{}
