import { inject, Injectable, signal } from '@angular/core';
import { API_URL } from '@environment';
import { io } from 'socket.io-client';
import { MessageData } from './message.interface';
import { AuthService } from '../../core/auth/services/auth.service';

@Injectable({providedIn: 'root'})
export class MessageService {
	private readonly access_token = inject(AuthService).access_token
	private readonly io = io(`${API_URL}/message`, { auth: { token: this.access_token } })

	messages = signal<MessageData[]>([]) 

	findAllMessages(roomId: string) {
		this.io.emit('findAllMessages', roomId, (res: MessageData[]) => {
			this.messages.set(res)
		});
  }
	
	updateMessage(roomId: string){
		this.io.on('newMessage', (res: MessageData) => {
			if(res.message.chatId === roomId){
				this.messages.update(messages => [...messages, res])
			}
		});
	}
	
	sendMessage(content: string, roomId: string){
		this.io.emit('sendMessage', { content, roomId })
	}

}
