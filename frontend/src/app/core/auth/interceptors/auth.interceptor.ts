import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { BehaviorSubject, catchError, filter, switchMap, tap, throwError } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';

let isRefreshing$ = new BehaviorSubject<boolean>(false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService)
  const access_token = inject(CookieService).get('ACCESS_TOKEN')
  
  if(isRefreshing$.value){
    return refresh(authService, req, next);
  }

  return next(addToken(req, access_token))
  .pipe(
    catchError((err) =>{
      if(err.status === 401){
        return refresh(authService, req, next);
      }
      return throwError(() => err);
    })
  );
};


const refresh = (
  AuthService: AuthService,
  req: HttpRequest<any>,
  next: HttpHandlerFn
) => {
  if (!isRefreshing$.value) {
    isRefreshing$.next(true);
    return AuthService.refreshToken().pipe(
      switchMap((res) => {
        return next(addToken(req, res.access_token)).pipe(
          tap(() => isRefreshing$.next(false))
        );
      })
    );
  }

  if (req.url.includes('refresh'))
    return next(addToken(req, AuthService.access_token!));

  return isRefreshing$.pipe(
    filter((isRefreshing) => !isRefreshing),
    switchMap(() => {
      return next(addToken(req, AuthService.access_token!));
    })
  );
};

const addToken = (
  req: HttpRequest<any>,
  token: string,
) => {
  return req.clone({
    setHeaders: {
      Authorization: token,
    },
  });
};
