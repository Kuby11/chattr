import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { Profile, User } from '../../../../shared/interfaces';
import { currentPageService } from '../../services';
import { DatePipe } from '@angular/common';
import { HlmAvatarComponent, HlmAvatarFallbackDirective, HlmAvatarImageDirective } from '@spartan-ng/ui-avatar-helm';

@Component({
  selector: 'app-current-profile',
  imports: [
    DatePipe,
    HlmAvatarComponent,
    HlmAvatarFallbackDirective,
    HlmAvatarImageDirective,
  ],
  templateUrl: './current-profile.component.html',
  styleUrl: './current-profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentProfileComponent implements OnInit {
  private readonly currentPageService = inject(currentPageService);
  private readonly activatedRoute = inject(ActivatedRoute);

  profileData = signal<Profile | null>(null);
  userData = signal<User | null>(null);

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

    this.currentPageService.setPage('your profile');
  }
}
