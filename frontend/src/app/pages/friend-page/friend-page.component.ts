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
import { iconoirSearch } from '@ng-icons/iconoir';
import { SearchFilterPipe } from '../../shared/pipes/search-filter.pipe';
import { FormControl, FormsModule, NgModel } from '@angular/forms';


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
    SearchFilterPipe,
    FormsModule,
    NgIcon,
    FirstLetterPipe,
  ],
  templateUrl: './friend-page.component.html',
  styleUrl: './friend-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ iconoirSearch })],
})
export class FriendPageComponent {
  friendsStore = inject(friendsStore);
  currentPage = inject(currentPageService);

  isLoading = computed(() => !this.friendsStore.friends());
  search = signal<string>('');

  constructor() {
    this.friendsStore.loadFriends();
    this.currentPage.setPage('friends');
  }

}
