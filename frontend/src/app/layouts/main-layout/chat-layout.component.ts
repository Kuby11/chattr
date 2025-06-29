import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../widgets/sidebar/sidebar.component';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';
import { toast } from 'ngx-sonner';
import { currentPageService, UserService } from '../../shared/services';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { iconoirArchive, iconoirEmojiTalkingHappy, iconoirForwardMessage, iconoirLogIn, iconoirMenu, iconoirPeopleTag, iconoirProfileCircle, iconoirSettings, iconoirUser } from '@ng-icons/iconoir';
import { BrnSheetContentDirective, BrnSheetTriggerDirective } from '@spartan-ng/brain/sheet';
import {
  HlmSheetComponent,
  HlmSheetContentComponent,
  HlmSheetDescriptionDirective,
  HlmSheetFooterComponent,
  HlmSheetHeaderComponent,
  HlmSheetTitleDirective,
} from '@spartan-ng/ui-sheet-helm';
import { SidebarItem, User } from '../../shared/interfaces';
import { firstValueFrom } from 'rxjs';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import { BrnSeparatorComponent } from '@spartan-ng/brain/separator';
import { HlmAvatarImageDirective, HlmAvatarComponent, HlmAvatarFallbackDirective } from '@spartan-ng/ui-avatar-helm';
import { currentProfileStore } from '../../shared/stores/current-profile.store';
import { FirstLetterPipe } from '../../shared/pipes/first-letter.pipe';
import { ThemeSwitcherComponent } from '../../features/theme-switcher/theme-switcher.components';
import { currentUserStore } from '../../shared/stores/current-user.store';



@Component({
  selector: 'app-chat-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    SidebarComponent,
    HlmToasterComponent,
    HlmIconDirective,
    NgIcon,
    HlmSheetComponent,
    HlmSheetContentComponent,
    HlmButtonDirective,
    BrnSheetContentDirective,
    BrnSheetTriggerDirective,
    HlmSheetHeaderComponent,
    HlmAvatarImageDirective, 
    HlmAvatarComponent, 
    HlmAvatarFallbackDirective,
    HlmSeparatorDirective,
    BrnSeparatorComponent,
    FirstLetterPipe,
    ThemeSwitcherComponent,
  ],
  templateUrl: './chat-layout.component.html',
  styleUrl: './chat-layout.component.css',
  providers: [
    provideIcons({ 
      iconoirMenu,
      iconoirLogIn,
      iconoirSettings,
      iconoirForwardMessage,
      iconoirProfileCircle,
      iconoirPeopleTag,
      iconoirUser,
      iconoirArchive,
      iconoirEmojiTalkingHappy,
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatLayoutComponent implements OnInit {
  private readonly currentPageService = inject(currentPageService);
    
  currentUserStore = inject(currentUserStore)
  currentProfileStore = inject(currentProfileStore)

  currentPage = computed(() => this.currentPageService._currentPage());

  constructor() {
    effect(() => {
      this.sidebarCommunicationItems[0].route = `profile/${
        this.currentUserStore.user().id
      }`;
    });
    console.log(this.currentProfileStore.profile().bio)
  }

  inputMessage = '';
  inputDescription = '';

  ngOnInit() {
    this.currentPageService.setPage('home');
  }

  sidebarCommunicationItems: SidebarItem[] = [
    {
      title: 'Profile',
      route: `profile/${this.currentUserStore.user().id}`,
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

  sidebarOtherItems: SidebarItem[] = [
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

  sidebarItems = {
    communication: this.sidebarCommunicationItems,
    other: this.sidebarOtherItems,
  };

  showToast() {
    toast(this.inputMessage, {
      description: this.inputDescription,
      duration: 1000,
    });
  }
}
