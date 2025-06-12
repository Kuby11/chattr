import { ResolveFn } from '@angular/router';
import { API_URL } from '../../constants';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

export const userResolver: ResolveFn<any> = (route, state) => {
  const http = inject(HttpClient); 
  const userId = route.params['id']
  
  const userData = http.get(`${API_URL}/user/find/${userId}`); 

  return userData
};
