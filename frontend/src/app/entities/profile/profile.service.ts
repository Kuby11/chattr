import { inject, Injectable } from '@angular/core';
import { API_URL } from '../../constants';
import { HttpClient } from '@angular/common/http';
import { currentProfileStore } from './current-profile.store';
import { Profile } from './profile.interface';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly http = inject(HttpClient)
  private readonly profileStore = inject(currentProfileStore)
  private readonly API_URL = API_URL

  constructor(){
    this.loadDataToStore();
  }
  
  updateProfile(id: string, payload: Partial<Profile>){
    return this.http.patch<Partial<Profile>>(`${this.API_URL}/profile/update/${id}`, { ...payload })
  }
  
  getAllProfiles(){
    return this.http.get<Profile[]>(`${this.API_URL}/profile/all`)
  }
  
  getCurrentProfile(){
    return this.http.get<Profile>(`${this.API_URL}/profile/me`)
  }
  
  loadDataToStore(){
    this.getCurrentProfile().subscribe((profile) => {
      this.profileStore.setCurrentProfile(profile) 
    })
  }
}
