import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { MessageService } from '../..';
import { roomStore } from '../../../room';

@Component({
  selector: 'app-message-input',
  imports: [
    FormsModule,
    HlmInputDirective,
    HlmButtonDirective
  ],
  templateUrl: './message-input.component.html',
  styleUrl: './message-input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageInputComponent {
  private readonly messageService = inject(MessageService)
  private readonly roomStore = inject(roomStore)
  private readonly messageInputEl = viewChild<ElementRef<HTMLElement>>('el')

  currentRoomId = computed(() => this.roomStore.currentRoomId())
  
  chatOffset = computed(() => {
    if(!this.messageInputEl()?.nativeElement){
      return 0
    }else{
      return (this.messageInputEl()!.nativeElement.offsetHeight / 16) + 1
    }
  })

  onSubmit(form: NgForm){
    if(form.valid && form.value.messageContent){
      this.messageService.sendMessage(form.value.messageContent, this.currentRoomId()!)
      form.value.messageContent = ''
    }
  }

}
