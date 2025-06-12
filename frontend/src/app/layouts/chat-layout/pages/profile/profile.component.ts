import { ChangeDetectionStrategy, Component, inject, OnInit, signal,} from '@angular/core';
import { currentPageService } from '../../services';
import { ActivatedRoute } from '@angular/router';
import { Profile, User } from '../../../../shared/interfaces';
import { map } from 'rxjs';
import { HlmAvatarComponent, HlmAvatarFallbackDirective, HlmAvatarImageDirective } from '@spartan-ng/ui-avatar-helm';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-profile',
  imports: [
    HlmAvatarComponent,
    HlmAvatarFallbackDirective,
    HlmAvatarImageDirective,
    DatePipe
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private readonly currentPageService = inject(currentPageService);
  private readonly activatedRoute = inject(ActivatedRoute);

  profileData = signal<Profile | null>(null)
  userData = signal<User | null>(null)
  
  data = this.activatedRoute.data

  ngOnInit() {
    this.data.pipe(
      map((data)=>{
        this.profileData.set(data['profile'])
        this.userData.set(data['user'])
      })
    ).subscribe()
    
    this.currentPageService.setPage(this.userData()?.username + '`s profile');
  }
}
