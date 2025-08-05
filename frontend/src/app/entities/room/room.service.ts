import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../../core/auth/services/auth.service';
import { io } from 'socket.io-client';
import { API_URL } from '@environment';
import { HttpClient } from '@angular/common/http';
import { Room } from './room.interface';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private readonly API_URL = `${API_URL}/room`
  private readonly access_token = inject(AuthService).access_token
	private readonly io = io(this.API_URL, { auth: { token: this.access_token } })

  loadRooms(patchStateFn: (rooms: Room[]) => void){
    this.io.emit('getRooms', {}, (res: Room[]) => {
      patchStateFn(res)
    })
  }

  HandleJoinRoom(){
    this.io.on('joinRoom', (response: Room) => {
      console.log(response)
    })
  }

  handleLeaveRoom(){
    this.io.on('leaveRoom', (res) => {
      console.log('leaved')
    })
  }
  
  joinRoom(roomId: string){
    this.io.emit('joinRoom', roomId)
  }

  leaveRoom(roomId: string){
    this.io.emit('leaveRoom', roomId )
  }
}
