import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../widgets/sidebar/sidebar.component';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
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
  iconoirCommunity,
  iconoirSearch
} from '@ng-icons/iconoir';
import { BrnSheetContentDirective, BrnSheetTriggerDirective } from '@spartan-ng/brain/sheet';
import {
  HlmSheetComponent,
  HlmSheetContentComponent,
  HlmSheetHeaderComponent,
} from '@spartan-ng/ui-sheet-helm';
import { SidebarItem } from '../../shared/interfaces';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import { BrnSeparatorComponent } from '@spartan-ng/brain/separator';
import { HlmAvatarImageDirective, HlmAvatarComponent, HlmAvatarFallbackDirective } from '@spartan-ng/ui-avatar-helm';
import { FirstLetterPipe } from '../../shared/pipes/first-letter.pipe';
import { ThemeModes, ThemeSwitcherComponent } from '../../features/theme-switcher/theme-switcher.components';
import { profileStore } from '../../entities/profile';
import { currentPageService, LocalStorageService } from '../../shared/services';
import { userStore } from '../../entities/user';



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
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
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
      iconoirSearch
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent implements OnInit {
  private readonly currentPageService = inject(currentPageService);
  appTheme = inject(LocalStorageService).getItem('theme') as ThemeModes
  
  userStore = inject(userStore);
  profileStore = inject(profileStore);
  currentPage = computed(() => this.currentPageService._currentPage());

  inputMessage = '';
  inputDescription = '';

  constructor() {
    this.profileStore.loadCurrentProfile()
    this.userStore.loadCurrentUser()
    effect(() => {
      this.sidebarCommunicationItems[0].route = `profile/${
        this.userStore.currentUser()?.id
      }`;
    });
  }


  ngOnInit() {
    this.currentPageService.setPage('home');
  }

  sidebarCommunicationItems: SidebarItem[] = [
    {
      title: 'Profile',
      route: `profile/${this.userStore.currentUser()?.id}`,
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
    },
    {
      title: 'find users',
      route: 'find-user',
      icon: 'iconoirSearch'
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
