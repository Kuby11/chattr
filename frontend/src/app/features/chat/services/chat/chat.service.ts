import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { Message } from '../../../../entities/message';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  socket = io(`localhost:3000/message`);

  messages: Message[] = [];

  findAllMessages() {
    this.socket.emit('findAllMessages', {}, (res: Message[]) => {
      console.log(res);
      this.messages.push(...res);
    });

    return this.messages;
  }

  updateMessage() {
    this.socket.on('sendMessage', (res: Message) => {
      this.messages.push(res);
      console.log(res);
    });
  }
}
