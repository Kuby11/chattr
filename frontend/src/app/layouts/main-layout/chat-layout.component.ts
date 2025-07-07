import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../widgets/sidebar/sidebar.component';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';
import { toast } from 'ngx-sonner';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { 
  iconoirArchive, 
  iconoirEmojiTalkingHappy, 
  iconoirForwardMessage, 
  iconoirLogIn, 
  iconoirMenu, 
  iconoirPeopleTag, 
  iconoirProfileCircle, 
  iconoirSettings, 
  iconoirUser,
  iconoirCommunity
} from '@ng-icons/iconoir';
import { BrnSheetContentDirective, BrnSheetTriggerDirective } from '@spartan-ng/brain/sheet';
import {
  HlmSheetComponent,
  HlmSheetContentComponent,
  HlmSheetDescriptionDirective,
  HlmSheetFooterComponent,
  HlmSheetHeaderComponent,
  HlmSheetTitleDirective,
} from '@spartan-ng/ui-sheet-helm';
import { SidebarItem } from '../../shared/interfaces';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import { BrnSeparatorComponent } from '@spartan-ng/brain/separator';
import { HlmAvatarImageDirective, HlmAvatarComponent, HlmAvatarFallbackDirective } from '@spartan-ng/ui-avatar-helm';
import { FirstLetterPipe } from '../../shared/pipes/first-letter.pipe';
import { ThemeSwitcherComponent } from '../../features/theme-switcher/theme-switcher.components';
import { currentUserStore } from '../../entities/user/current-user.store';
import { ProfileService, currentProfileStore } from '../../entities/profile';
import { UserService } from '../../entities/user';
import { currentPageService } from '../../shared/services';



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
      iconoirCommunity,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatLayoutComponent implements OnInit {
  private readonly currentPageService = inject(currentPageService);
  private readonly ProfileService = inject(ProfileService);
  private readonly UserService = inject(UserService);
  private readonly currentUserStore = inject(currentUserStore);
  private readonly currentProfileStore = inject(currentProfileStore);

  currentUser = computed(() => this.currentUserStore.user());
  currentProfile = computed(() => this.currentProfileStore.profile());
  currentPage = computed(() => this.currentPageService._currentPage());

  constructor() {
    this.ProfileService.loadDataToStore();
    this.UserService.loadDataToStore();
    effect(()=>{
      this.sidebarCommunicationItems[0].route = `profile/${
        this.currentUser()?.id
      }`;
    })
  }

  inputMessage = '';
  inputDescription = '';

  ngOnInit() {
    this.currentPageService.setPage('home');
  }

  sidebarCommunicationItems: SidebarItem[] = [
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
    {
      title: 'friends',
      route: 'friends',
      icon: 'iconoirCommunity',
    }
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
