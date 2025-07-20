import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
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
  iconoirEmojiTalkingHappy,
  iconoirSearch
} from '@ng-icons/iconoir'
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import { BrnSeparatorComponent } from '@spartan-ng/brain/separator';
import { BrnTooltipContentDirective } from '@spartan-ng/brain/tooltip';
import { HlmTooltipComponent, HlmTooltipTriggerDirective } from '@spartan-ng/ui-tooltip-helm';
import { ThemeSwitcherComponent } from '../../features/theme-switcher/theme-switcher.components';
import { HlmAvatarImageDirective, HlmAvatarComponent, HlmAvatarFallbackDirective } from '@spartan-ng/ui-avatar-helm';
import { FirstLetterPipe } from '../../shared/pipes/first-letter.pipe';
import { profileStore } from '../../entities/profile';
import { SidebarItems } from '../../shared/interfaces';
import { userStore } from '../../entities/user';


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
    HlmAvatarImageDirective, 
    HlmAvatarComponent, 
    HlmAvatarFallbackDirective,
    FirstLetterPipe,
    RouterLink,
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
      iconoirSearch
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  profileStore = inject(profileStore)
  userStore = inject(userStore)
  sidebarItems = input<SidebarItems>()
  
  constructor(){
    this.userStore.loadCurrentUser()
    this.profileStore.currentProfile()
  }

}
