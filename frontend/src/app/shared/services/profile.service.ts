import { inject, Injectable } from '@angular/core';
import { API_URL } from '../../constants';
import { HttpClient } from '@angular/common/http';
import { Profile } from '../interfaces';
import { currentProfileStore } from '../stores/current-profile.store';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly http = inject(HttpClient)
  private readonly profileStore = inject(currentProfileStore)
  private readonly API_URL = API_URL

  constructor(){
    firstValueFrom(this.getCurrentProfile())
    .then((profile) => {
      this.profileStore.setCurrentProfile(profile)
    })
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
}
