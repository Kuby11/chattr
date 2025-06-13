import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client'
import { API_URL } from '../../constants';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly URL = API_URL;
}
