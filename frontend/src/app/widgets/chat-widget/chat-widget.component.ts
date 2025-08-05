import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, linkedSignal, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { Message, MessageData, MessageService } from '../../entities/message';
import { FormsModule, NgForm } from '@angular/forms';

import { RoomService, roomStore } from '../../entities/room';

import { ActivatedRoute, Params } from '@angular/router';
import { MessageBubbleComponent } from '../../entities/message/components/message-bubble/message-bubble.component';

@Component({
  selector: 'app-chat-widget',
  imports: [
    FormsModule,
    MessageBubbleComponent,
  ],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.css',
  providers: [
    MessageService,
    RoomService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  private readonly messageService = inject(MessageService)
  private readonly route = inject(ActivatedRoute)
  private readonly roomService = inject(RoomService)
  private readonly roomStore = inject(roomStore)
  
  currentRoomId = computed(() => this.roomStore.currentRoomId())
  messages = computed<MessageData[]>(() => this.messageService.messages())

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('chatId')!
      this.roomStore.setCurrentRoomId(id)
      this.roomService.leaveRoom(this.currentRoomId())      
      this.loadChatData()
    })
    this.roomService.HandleJoinRoom()
    this.messageService.updateMessage(this.currentRoomId())
  }

  ngOnDestroy(): void {
    this.roomService.leaveRoom(this.currentRoomId())
  }

  onSubmit(form: NgForm){
    if(form.valid && form.value.messageContent){
      this.messageService.sendMessage(form.value.messageContent, this.currentRoomId()!)
    }
  }

  private loadChatData(){
    this.roomService.joinRoom(this.currentRoomId()!)
    this.messageService.findAllMessages(this.currentRoomId())
  }
}
