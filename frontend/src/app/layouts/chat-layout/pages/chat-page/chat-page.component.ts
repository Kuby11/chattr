import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { ChatWidgetComponent } from '../../../../widgets/chat-widget/chat-widget.component';
import { currentPageService } from '../../services';
import { UserService } from '../../../../shared/services/user.service';
import { User } from '../../../../shared/interfaces';
import { firstValueFrom } from 'rxjs';
import { HlmAvatarImageDirective, HlmAvatarComponent, HlmAvatarFallbackDirective } from '@spartan-ng/ui-avatar-helm';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-chat-page',
  imports: [
    ChatWidgetComponent,
    HlmAvatarComponent,
    HlmAvatarFallbackDirective,
    HlmAvatarImageDirective,
    RouterLink

  ],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPageComponent implements OnInit {
  private readonly pageService = inject(currentPageService);
  private readonly userService = inject(UserService);

  usersRef = signal<User[]>([])
  users = this.userService.getAllUsers()

  ngOnInit() {
    this.loadUsers();
    this.pageService.setPage('chat');
  }

  private async loadUsers() {
    const response = await firstValueFrom(this.users);
    this.usersRef.set(response);
  }
}
