import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Message } from '../..';
import { User, userStore } from '../../../user';
import { Profile } from '../../../profile';
import { AvatarComponent } from '../../../../shared/ui/avatar/avatar.component';

@Component({
  selector: 'app-message-bubble',
  imports: [
    AvatarComponent
  ],
  templateUrl: './message-bubble.component.html',
  styleUrl: './message-bubble.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageBubbleComponent {
  private readonly userStore = inject(userStore)

  messageData = input.required<Message>() 
  senderData = input.required<User>()
  ProfileData = input.required<Profile>()

  isYour = computed<boolean>(() => {
    if(this.messageData().senderId === this.userStore.currentUser()?.id){
      return true
    }else{
      return false
    }
  })
}
