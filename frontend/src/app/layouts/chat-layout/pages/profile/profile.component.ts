import { ChangeDetectionStrategy, Component, inject, OnInit, signal,} from '@angular/core';
import { currentPageService } from '../../services';
import { ActivatedRoute } from '@angular/router';
import { Profile, User } from '../../../../shared/interfaces';
import { map, tap } from 'rxjs';
import { HlmAvatarComponent, HlmAvatarFallbackDirective, HlmAvatarImageDirective } from '@spartan-ng/ui-avatar-helm';
import { DatePipe } from '@angular/common';
import { UserService } from '../../../../shared/services/user.service';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { BrnDialogContentDirective, BrnDialogTriggerDirective } from '@spartan-ng/brain/dialog';
import {
  HlmDialogComponent,
  HlmDialogContentComponent,
  HlmDialogDescriptionDirective,
  HlmDialogFooterComponent,
  HlmDialogHeaderComponent,
  HlmDialogTitleDirective,
} from '@spartan-ng/ui-dialog-helm';


@Component({
  selector: 'app-profile',
  imports: [
    HlmAvatarComponent,
    HlmAvatarFallbackDirective,
    HlmAvatarImageDirective,
    HlmButtonDirective,
    HlmInputDirective,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogDescriptionDirective,
    HlmDialogFooterComponent,
    HlmDialogHeaderComponent,
    HlmDialogTitleDirective,
    BrnDialogContentDirective,
    BrnDialogTriggerDirective,
    DatePipe,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private readonly currentPageService = inject(currentPageService);
  private readonly userService = inject(UserService);
  private readonly activatedRoute = inject(ActivatedRoute);

  profileData = signal<Profile | null>(null);
  userData = signal<User | null>(null);
  isCurrentUser = signal<boolean>(false);

  data = this.activatedRoute.data;

  ngOnInit() {
    this.data
      .pipe(
        map((data) => {
          this.profileData.set(data['profile']);
          this.userData.set(data['user']);
        })
      )
      .subscribe();

    this.userService
      .getMe()
      .pipe(
        tap((data) => {
          if (data.id === this.userData()!.id) {
            this.isCurrentUser.set(true);
          }
        })
      )
      .subscribe();
   

    this.currentPageService.setPage(this.userData()?.username + '`s profile');
  }
}
