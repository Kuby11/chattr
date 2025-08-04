import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Message } from '../../entities/message';
import { User } from '../../entities/user';
import { Profile } from '../../entities/profile';

@Component({
  selector: 'app-message-bubble',
  imports: [],
  templateUrl: './message-bubble.component.html',
  styleUrl: './message-bubble.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageBubbleComponent {
  messageData = input.required<Message>() 
  senderData = input.required<User>()
  ProfileData = input.required<Profile>()
}
