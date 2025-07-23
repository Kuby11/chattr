import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Friend } from './interfaces/friend.interface';
import { API_URL } from '@environment';
import { FriendRequest } from './interfaces/friend-request.interface';

@Injectable({
  providedIn: 'root',
})
export class FriendService {
  private readonly http = inject(HttpClient);

  getFriends() {
    return this.http.get<Friend[]>(`${API_URL}/friend/friends`)
  }

  getUserFriends(id: string) {
    return this.http.get<Friend[]>(`${API_URL}/friend/friends/${id}`)
  }

  getFriendRequests(){
    return this.http.get<FriendRequest[]>(`${API_URL}/friend/friend-requests`)
  }

  removeFriend(friendId: string) {
    return this.http.delete(`${API_URL}/friend/${friendId}`)
  }

  sendFriendRequest(receiverId: string){
    return this.http.post(`${API_URL}/friend/send-friend-request/${receiverId}`, {})
  }

  acceptFriendRequest(requestId: string){
    return this.http.post<FriendRequest>(`${API_URL}/friend/accept-friend-request/${requestId}`, {})
  }
  
  declineFriendRequest(requestId: string){
    return this.http.post<FriendRequest>(`${API_URL}/friend/decline-friend-request/${requestId}`, {})
  }
  
  cancelFriendRequest(requestId: string){
    return this.http.delete<FriendRequest>(`${API_URL}/friend/friend-request/${requestId}`, {})
  }

}
