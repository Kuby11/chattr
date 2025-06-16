import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { provideIcons, NgIcon } from '@ng-icons/core'
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { 
  iconoirSettings,
  iconoirLogIn,
  iconoirForwardMessage, 
  iconoirProfileCircle,
  iconoirPeopleTag,
  iconoirUser,
  iconoirArchive, 
  iconoirEmojiTalkingHappy
} from '@ng-icons/iconoir'
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import { BrnSeparatorComponent } from '@spartan-ng/brain/separator';
import { BrnTooltipContentDirective } from '@spartan-ng/brain/tooltip';
import { HlmTooltipComponent, HlmTooltipTriggerDirective } from '@spartan-ng/ui-tooltip-helm';
import { ThemeSwitcherComponent } from '../../features/components/theme-switcher/theme-switcher.components';
import { UserService } from '../../shared/services/user.service';
import { User } from '../../shared/interfaces';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    HlmButtonDirective,
    HlmIconDirective,
    NgIcon,
    HlmSeparatorDirective,
    BrnSeparatorComponent,
    BrnTooltipContentDirective,
    HlmTooltipComponent,
    HlmTooltipTriggerDirective,
    ThemeSwitcherComponent,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  providers: [
    provideIcons({
      iconoirLogIn,
      iconoirSettings,
      iconoirForwardMessage,
      iconoirProfileCircle,
      iconoirPeopleTag,
      iconoirUser,
      iconoirArchive,
      iconoirEmojiTalkingHappy,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly userService = inject(UserService);
  
  currentUser = signal<User | null>(null)

  constructor() {
    effect(()=>{
      this.sidebarCommunicationItems[0].route = `profile/${this.currentUser()?.id}`
    })
    firstValueFrom(this.userService.getMe())
    .then(user => {
      this.currentUser.set(user)
    })
  }

  sidebarCommunicationItems = [
    {
      title: 'Profile',
      route: `profile/${this.currentUser()?.id}`,
      icon: 'iconoirProfileCircle',
    },
    {
      title: 'Chats',
      route: 'chats',
      icon: 'iconoirForwardMessage',
    },
    {
      title: 'Contacts',
      route: 'contacts',
      icon: 'iconoirUser',
    },
  ];
  sidebarOtherItems = [
    {
      title: 'Auth',
      route: 'auth',
      icon: 'iconoirLogIn',
    },
    {
      title: 'Archive',
      route: 'archive',
      icon: 'iconoirArchive',
    },
  ];
}
