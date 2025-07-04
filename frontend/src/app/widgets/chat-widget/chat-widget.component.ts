import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { ChatService } from '../../features/chat/services/chat/chat.service';
import { io } from 'socket.io-client';
import { Message } from '../../entities/message';

@Component({
  selector: 'app-chat-widget',
  imports: [],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatWidgetComponent implements OnInit {
  private readonly chatService = inject(ChatService)
  socket = io(`localhost:3000/message`);

  messagesRef = signal<Message[]>([])
  
  ngOnInit(): void {
    this.findAllMessages()
    this.updateMessage()
    console.log(this.messagesRef());

  }

  private findAllMessages() {
    this.socket.emit('findAllMessages', {}, (res: Message[]) => {
      console.log(res);
      this.messagesRef.set(res);
    });
  }

  updateMessage() {
    this.socket.on('sendMessage', (res: Message) => {
      this.messagesRef.update((messages) => [...messages, res]);
      console.log(res);
    });
  }

}
