import { ChangeDetectionStrategy, Component, effect, inject, input, OnInit, signal } from '@angular/core';
import { ChatWidgetComponent } from '../../../../widgets/chat-widget/chat-widget.component';
import { currentPageService } from '../../services';
import { UserService } from '../../../../shared/services/user.service';
import { User } from '../../../../shared/interfaces';
import { firstValueFrom } from 'rxjs';
import { HlmAvatarImageDirective, HlmAvatarComponent, HlmAvatarFallbackDirective } from '@spartan-ng/ui-avatar-helm';
import { RouterLink } from '@angular/router';
import { HlmSkeletonComponent } from '@spartan-ng/ui-skeleton-helm';


@Component({
  selector: 'app-chat-page',
  imports: [
    ChatWidgetComponent,
    HlmAvatarComponent,
    HlmAvatarFallbackDirective,
    HlmAvatarImageDirective,
    HlmSkeletonComponent,
    RouterLink,
  ],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPageComponent implements OnInit {
  private readonly pageService = inject(currentPageService);
  private readonly userService = inject(UserService);

  users = signal<User[]>([]);
  skeletonItems = signal<number[]>(Array(20).fill(0))
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.loadUsers();
    this.pageService.setPage('chat');
  }

  private async loadUsers() {
    const response = await firstValueFrom(this.userService.getAllUsers());
    if (response) {
      this.isLoading.set(false);
    }
    this.users.set(response)
  }
}
