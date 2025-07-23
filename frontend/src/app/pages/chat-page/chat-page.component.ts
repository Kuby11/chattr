import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ChatWidgetComponent } from '../../widgets/chat-widget/chat-widget.component';
import { firstValueFrom } from 'rxjs';
import { HlmAvatarImageDirective, HlmAvatarComponent, HlmAvatarFallbackDirective } from '@spartan-ng/ui-avatar-helm';
import { RouterLink } from '@angular/router';
import { HlmSkeletonComponent } from '@spartan-ng/ui-skeleton-helm';
import { FirstLetterPipe } from '../../shared/pipes/first-letter.pipe';
import { ShortenUsernamePipe } from '../../shared/pipes/shorten-username.pipe';
import { currentPageService } from '../../shared/services';
import { friendsStore } from '../../entities/friend/friend.store';


@Component({
  selector: 'app-chat-page',
  imports: [
    ChatWidgetComponent,
    HlmAvatarComponent,
    HlmAvatarFallbackDirective,
    HlmAvatarImageDirective,
    HlmSkeletonComponent,
    ShortenUsernamePipe,
    FirstLetterPipe,
    RouterLink,
  ],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPageComponent implements OnInit {
  private readonly pageService = inject(currentPageService);
  
  friendStore = inject(friendsStore)

  skeletonItems = signal<number[]>(Array(20).fill(0))

  ngOnInit() {
    this.friendStore.loadMyFriends()
    this.pageService.setPage('chat');
  }
}
