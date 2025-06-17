import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ChatWidgetComponent } from '../../../../widgets/chat-widget/chat-widget.component';
import { currentPageService } from '../../services';
import { Profile, User } from '../../../../shared/interfaces';
import { firstValueFrom } from 'rxjs';
import { HlmAvatarImageDirective, HlmAvatarComponent, HlmAvatarFallbackDirective } from '@spartan-ng/ui-avatar-helm';
import { RouterLink } from '@angular/router';
import { HlmSkeletonComponent } from '@spartan-ng/ui-skeleton-helm';
import { ProfileService } from '../../../../shared/services/profile.service';
import { FirstLetterPipe } from '../../../../shared/pipes/first-letter.pipe';
import { ShortenUsernamePipe } from '../../../../shared/pipes/shorten-username.pipe';


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
  private readonly profileService = inject(ProfileService);

  profiles = signal<Profile[]>([]);
  skeletonItems = signal<number[]>(Array(20).fill(0))
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.loadUsers();
    this.pageService.setPage('chat');
  }

  private async loadUsers() {
    const response = await firstValueFrom(this.profileService.getAllProfiles());
    if (response) {
      this.isLoading.set(false);
    }
    this.profiles.set(response)
  }
}
