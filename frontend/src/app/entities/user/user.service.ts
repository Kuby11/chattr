import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../constants';
import { currentUserStore, User } from '.';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient)
  private readonly URL = API_URL
  private readonly currentUserStore = inject(currentUserStore) 

  getAllUsers() {
    return this.http.get<User[]>(`${this.URL}/user/all`)
  }

  getMe() {
    return this.http.get<User>(`${API_URL}/user/me`)
  }

}
