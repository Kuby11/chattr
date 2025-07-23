import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { iconoirSearch, iconoirArrowLeft, iconoirUserPlus } from '@ng-icons/iconoir'
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { RouterLink } from '@angular/router';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmFormFieldComponent, HlmFormFieldModule } from '@spartan-ng/ui-formfield-helm';
import { FormsModule, NgForm } from '@angular/forms';
import { userStore } from '../../entities/user';
import { FirstLetterPipe } from '../../shared/pipes/first-letter.pipe';
import { DatePipe } from '@angular/common';
import { HlmAvatarComponent, HlmAvatarFallbackDirective, HlmAvatarImageDirective } from '@spartan-ng/ui-avatar-helm';
import { LoaderComponent } from '../../shared/ui/loader/loader.component';
import { FriendService } from '../../entities/friend';
import { toast } from 'ngx-sonner';
import { friendsStore } from '../../entities/friend/friend.store';
import { IconButtonComponent } from '../../shared/ui/icon-button/icon-button.component';
import { NavigateButtonComponent } from '../../shared/ui/navigate-button/navigate-button.component';
import { currentPageService } from '../../shared/services';
import { UserCardPopoverComponent } from '../../shared/ui/user-card-popover/user-card-popover.component';
import { AvatarComponent } from '../../shared/ui/avatar/avatar.component';
import { BrnPopoverCloseDirective, BrnPopoverComponent, BrnPopoverContentDirective, BrnPopoverTriggerDirective } from '@spartan-ng/brain/popover';
import { HlmPopoverContentDirective } from '@spartan-ng/ui-popover-helm';


@Component({
  selector: 'app-add-friend-page',
  imports: [
    HlmInputDirective,
    HlmIconDirective,
    RouterLink,
    HlmButtonDirective,
    HlmFormFieldModule,
    HlmFormFieldComponent,
    FormsModule,
    RouterLink,
    HlmIconDirective,
    FormsModule,
    NgIcon,
    HlmButtonDirective,
    LoaderComponent,
    IconButtonComponent,
    UserCardPopoverComponent,
    AvatarComponent,
    NgIcon,
  ],
  templateUrl: './find-user-page.component.html',
  styleUrl: './find-user-page.component.css',
  providers: [
    userStore,
    provideIcons({
      iconoirSearch,
      iconoirUserPlus,
      iconoirArrowLeft
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FindUserPageComponent {
  private readonly friendService = inject(FriendService)
  private readonly currentPageService = inject(currentPageService)

  friendStore = inject(friendsStore)
  userStore = new userStore()
  disabledButtons = signal<boolean[]>([])

  constructor(){
    this.currentPageService.setPage('find user')
  }

  onSubmit(form: NgForm){
    const searchQuery = form.value.searchQuery 
    if(form.valid){
      this.userStore.findUsers(searchQuery)
    }
  }

  sendFriendRequest(receiverId: string){
    this.friendService.sendFriendRequest(receiverId).subscribe()
    toast('friend request sent!')
  }

  disableButton(index: number){
    this.disabledButtons()[index] = true
  }
}
