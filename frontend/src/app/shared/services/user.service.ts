import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../interfaces';
import { API_URL } from '../../constants';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient)
  private readonly URL = API_URL

  currentUser: User | null = null 

  constructor(){
    this.getMe().subscribe((user) => {
      this.currentUser = user 
    })
  }

  getAllUsers() {
    return this.http.get<User[]>(`${this.URL}/user/all`)
  }

  getMe() {
    return this.http.get<User>(`${API_URL}/user/me`)
  }

}
