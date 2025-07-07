import { ResolveFn } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_URL } from '@environment';

export const profileResolver: ResolveFn<any> = (route, state) => {
  const http = inject(HttpClient); 
  const userId = route.params['id']
  
  const profileData = http.get(`${API_URL}/profile/find/${userId}`); 

  return profileData
};
