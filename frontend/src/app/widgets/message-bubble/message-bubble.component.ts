import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Message } from '../../entities/message';
import { User, userStore } from '../../entities/user';
import { Profile } from '../../entities/profile';
import { AvatarComponent } from '../../shared/ui/avatar/avatar.component';

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
