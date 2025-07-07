import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '.';
import { API_URL } from '@environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient)

  getAllUsers() {
    return this.http.get<User[]>(`${API_URL}/user/all`)
  }

  getMe() {
    return this.http.get<User>(`${API_URL}/user/me`)
  }

}
