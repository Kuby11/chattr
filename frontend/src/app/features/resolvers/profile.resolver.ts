import { ResolveFn } from '@angular/router';
import { API_URL } from '../../constants';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

export const profileResolver: ResolveFn<any> = (route, state) => {
  const http = inject(HttpClient); 
  const userId = route.params['id']
  
  const profileData = http.get(`${API_URL}/profile/find/${userId}`); 

  return profileData
};
