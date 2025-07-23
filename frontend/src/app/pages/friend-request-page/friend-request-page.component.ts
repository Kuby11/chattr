import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { friendsStore } from '../../entities/friend/friend.store';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { iconoirUserPlus, iconoirUserXmark } from '@ng-icons/iconoir'
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { IconButtonComponent } from '../../shared/ui/icon-button/icon-button.component';
import { toast } from 'ngx-sonner';
import { HlmSkeletonComponent } from '@spartan-ng/ui-skeleton-helm';
import { userStore } from '../../entities/user';
import { HlmTabsComponent, HlmTabsContentDirective, HlmTabsListComponent, HlmTabsTriggerDirective } from '@spartan-ng/ui-tabs-helm';

@Component({
  selector: 'app-friend-request-page',
  imports: [
    HlmButtonDirective,
    IconButtonComponent,
    HlmSkeletonComponent,
    HlmIconDirective,
    HlmTabsComponent,
    HlmTabsContentDirective,
    HlmTabsListComponent,
    HlmTabsTriggerDirective,
    NgIcon
  ],
  templateUrl: './friend-request-page.component.html',
  styleUrl: './friend-request-page.component.css',
  providers: [
    provideIcons({
      iconoirUserPlus, iconoirUserXmark
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendRequestPageComponent {
  friendStore = inject(friendsStore)
  userStore = inject(userStore)

  requestsSentToUser = computed(() =>
    this.friendStore.friendRequests()
    .filter(req => req.receiverId === this.userStore.currentUser()?.id ) 
  )
  
  requestsSentByUser = computed(() => 
    this.friendStore.friendRequests()
    .filter(req => req.senderId === this.userStore.currentUser()?.id ) 
  )

  constructor(){
    this.friendStore.getFriendRequests()
    console.log(this.friendStore.friendRequests())
  }

  acceptFriendRequest(requestId: string){
    toast('a new friend added!')
    this.friendStore.acceptFriendRequest(requestId)
  }
  
  declineFriendRequest(requestId: string){
    toast('friend request declined!')
    this.friendStore.declineFriendRequest(requestId)
  }

  cancelFriendRequest(requestId: string){
    toast('friend request canceled!')
    this.friendStore.cancelFriendRequest(requestId)
  }
}
