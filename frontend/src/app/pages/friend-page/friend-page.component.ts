import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { friendsStore } from '../../entities/friend/friend.store';
import { HlmAvatarImageDirective, HlmAvatarComponent, HlmAvatarFallbackDirective } from '@spartan-ng/ui-avatar-helm';
import { FirstLetterPipe } from '../../shared/pipes/first-letter.pipe';
import { currentPageService } from '../../shared/services';
import { RouterLink } from '@angular/router';
import { HlmSkeletonComponent } from '@spartan-ng/ui-skeleton-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { iconoirSearch, iconoirUserXmark } from '@ng-icons/iconoir';
import { FormsModule, } from '@angular/forms';
import { BrnAlertDialogContentDirective, BrnAlertDialogTriggerDirective } from '@spartan-ng/brain/alert-dialog';
import {
  HlmAlertDialogActionButtonDirective,
  HlmAlertDialogCancelButtonDirective,
  HlmAlertDialogComponent,
  HlmAlertDialogContentComponent,
  HlmAlertDialogFooterComponent,
  HlmAlertDialogHeaderComponent,
  HlmAlertDialogTitleDirective,
} from '@spartan-ng/ui-alertdialog-helm';
import { filterFriendListPipe, SortFriendListPipe } from '../../entities/friend';
import { DatePipe } from '@angular/common';
import {
  BrnPopoverCloseDirective,
  BrnPopoverComponent,
  BrnPopoverContentDirective,
  BrnPopoverTriggerDirective,
} from '@spartan-ng/brain/popover';
import { HlmPopoverCloseDirective, HlmPopoverContentDirective } from '@spartan-ng/ui-popover-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { IconButtonComponent } from '../../shared/ui/icon-button/icon-button.component';

@Component({
  selector: 'app-friend-page',
  imports: [
    RouterLink,
    HlmAvatarImageDirective,
    HlmAvatarComponent,
    HlmAvatarFallbackDirective,
    HlmSkeletonComponent,
    HlmInputDirective,
    HlmIconDirective,
    FormsModule,
    NgIcon,
    filterFriendListPipe,
    HlmAlertDialogActionButtonDirective,
    HlmAlertDialogCancelButtonDirective,
    HlmAlertDialogComponent,
    HlmAlertDialogContentComponent,
    HlmAlertDialogFooterComponent,
    HlmAlertDialogHeaderComponent,
    HlmAlertDialogTitleDirective,
    BrnAlertDialogContentDirective, 
    BrnAlertDialogTriggerDirective,
    BrnPopoverComponent,
    BrnPopoverContentDirective,
    BrnPopoverTriggerDirective,
    HlmPopoverContentDirective,
    HlmButtonDirective,
    FirstLetterPipe,
    IconButtonComponent,
    DatePipe,
    RouterLink,
    SortFriendListPipe,
  ],
  templateUrl: './friend-page.component.html',
  styleUrl: './friend-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ iconoirSearch,iconoirUserXmark })],
})
export class FriendPageComponent {
  
  friendsStore = inject(friendsStore);
  currentPage = inject(currentPageService);

  isLoading = computed(() => !this.friendsStore.friends());
  searchQuery = signal<string>('');
  sortQuery = signal<string>('a-z')
  
  constructor() {
    this.friendsStore.loadFriends();
    this.currentPage.setPage('friends');
  }
  
  removeFriend(friendId: string, ctx: any){
    this.friendsStore.removeFriend(friendId)
    ctx.close()
  }
    
}
