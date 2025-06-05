import { ChangeDetectionStrategy, Component, inject, OnInit,} from '@angular/core';
import { currentPageService } from '../../services';
import { AuthService } from '../../../../auth/services/auth.service';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';

@Component({
  selector: 'app-profile',
  imports: [HlmButtonDirective],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService)
  currentPageService = inject(currentPageService);

  logout(){
    this.auth.logout();
  }

  test(){
    this.auth.getMe().subscribe(console.log);
  }

  ngOnInit() {
    this.currentPageService.setPage('profile');    
  }
}
