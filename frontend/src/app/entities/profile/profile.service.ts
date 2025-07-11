import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Profile } from './profile.interface';
import { API_URL } from '@environment';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly http = inject(HttpClient)

  updateProfile(id: string, payload: Partial<Profile>){
    return this.http.patch<Partial<Profile>>(`${API_URL}/profile/update/${id}`, { ...payload })
  }
  
  getAllProfiles(){
    return this.http.get<Profile[]>(`${API_URL}/profile/all`)
  }
  
  getCurrentProfile(){
    return this.http.get<Profile>(`${API_URL}/profile/me`)
  }
  
}
