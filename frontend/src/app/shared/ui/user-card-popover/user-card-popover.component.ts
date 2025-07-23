import { ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, inject, input, signal } from '@angular/core';
import { hlm } from '@spartan-ng/brain/core';
import { Profile } from '../../../entities/profile';
import { User } from '../../../entities/user';
import { AvatarComponent } from '../avatar/avatar.component';
import { BrnPopoverCloseDirective, BrnPopoverComponent, BrnPopoverContentDirective, BrnPopoverTriggerDirective } from '@spartan-ng/brain/popover';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmPopoverContentDirective } from '@spartan-ng/ui-popover-helm';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-card-popover',
  imports: [
    AvatarComponent,
    HlmButtonDirective,
    BrnPopoverComponent,
    BrnPopoverContentDirective,
    BrnPopoverCloseDirective,
    RouterLink,
    HlmPopoverContentDirective,
    BrnPopoverTriggerDirective

  ],
  template: `
    <brn-popover sideOffset="-300" class="relative">
      <button brnPopoverTrigger hlmBtn class="h-full w-full opacity-0 absolute"></button>
      <ng-content />
      <div hlmPopoverContent *brnPopoverContent="let ctx" class="w-50 h-50">
        <article class="h-full w-full flex flex-col gap-2 items-center p-2">
          <app-avatar 
            [fallback]="profileData()?.displayName" 
            [avatarUrl]="profileData()?.avatar"
            variant="large"
          />
          <div class="grid justify-center">
            <h3 class="ttr-h3 text-center">{{ profileData()?.displayName }}</h3>
            <a [routerLink]="['/profile/' + userData()?.id ]"  hlmBtn variant="link" class="text-lg py-0">#{{ userData()?.username }}</a>
          </div>
        </article>
      </div>
    </brn-popover>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserCardPopoverComponent {
  profileData = input<Profile>()
  userData = input<User>()
}
