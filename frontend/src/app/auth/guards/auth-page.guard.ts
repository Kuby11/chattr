import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authPageGuard: CanActivateFn = (route, state) => {
  const isAuth = inject(AuthService).isAuth()
  
  if(isAuth){
    return false
  }

  return true;
};
