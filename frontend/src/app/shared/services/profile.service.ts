import { inject, Injectable } from '@angular/core';
import { API_URL } from '../../constants';
import { HttpClient } from '@angular/common/http';
import { Profile } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly API_URL = API_URL
  private readonly http = inject(HttpClient)

  updateProfile(id: string, payload: Partial<Profile>){
    return this.http.patch<Partial<Profile>>(`${API_URL}/profile/update/${id}`, { ...payload })
  }

}
