import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { BehaviorSubject, catchError, filter, switchMap, tap, throwError } from 'rxjs';

let isRefreshing$ = new BehaviorSubject<boolean>(false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService)
  const access_token = authService.access_token;
  
  if(!access_token) return next(req);

  if(isRefreshing$.value){
    return refresh(authService, req, next);
  }

  return next(req)
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
  service: AuthService, 
  req: HttpRequest<any>, 
  next: HttpHandlerFn
) => {
  if(!isRefreshing$.value){
    isRefreshing$.next(true);
    return service.refreshToken()
    .pipe(
      switchMap((res) => {
        return next(addToken(req, res.access_token))
          .pipe(
            tap(() => isRefreshing$.next(false))
          )
      }),
    )
  }

  if(req.url.includes('refresh'))  return next(addToken(req, service.access_token!));
  

  return isRefreshing$.pipe(
    filter(isRefreshing => !isRefreshing ),
    switchMap(() => {
      return next(addToken(req, service.access_token!))
    })
  )
}

const addToken = (req: HttpRequest<any>, token: string) => {
  return req.clone({
    setHeaders: {
      Authorization: token,
    },
  })
}
