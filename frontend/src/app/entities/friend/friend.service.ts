import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Friend } from './friend.interface';

@Injectable({
  providedIn: 'root',
})
export class FriendService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = import.meta.url

  getCurrentFriends() {
    return this.http.get<Friend[]>(`${this.API_URL}/friend/my-friends`)
  }
}
