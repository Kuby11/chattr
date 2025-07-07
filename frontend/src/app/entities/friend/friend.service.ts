import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Friend } from './friend.interface';
import { API_URL } from '@environment';

@Injectable({
  providedIn: 'root',
})
export class FriendService {
  private readonly http = inject(HttpClient);

  getCurrentFriends() {
    return this.http.get<Friend[]>(`${API_URL}/friend/my-friends`)
  }
}
