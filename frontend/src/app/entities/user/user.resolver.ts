import { ResolveFn } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_URL } from '@environment';

export const userResolver: ResolveFn<any> = (route, state) => {
  const http = inject(HttpClient); 
  const userId = route.params['id']
  
  const userData = http.get(`${API_URL}/user/find/${userId}`); 

  return userData
};
