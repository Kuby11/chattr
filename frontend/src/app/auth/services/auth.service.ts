import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, inject, Injectable, OnInit } from '@angular/core';
import { AuthInterface, TokenResponse } from '../interfaces';
import { catchError, delay, interval, map, Observable, Subscription, tap, throwError } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly cookie = inject(CookieService);
  private readonly router = inject(Router);
  private readonly API_URL = 'http://localhost:3000';
  private readonly destroyRef = inject(DestroyRef);
  private readonly subscription?: Subscription

  errorMessage: string | null = null
  access_token: string | undefined = undefined;
  refresh_token: string | undefined = undefined;

  constructor() {
    //todo improve token refreshing
  
    if(this.refresh_token === undefined){
      this.cookie.delete('REFRESH_TOKEN');
    }

    this.subscription = interval(1000 * 60 * 3)
    .subscribe(() => {
      if(this.isAuth()){
        console.log('triggered')
        this.refreshToken()
        .subscribe()
      }
    });

    this.destroyRef.onDestroy(() => {
      this.subscription?.unsubscribe()
    });
  }

  isAuth(): boolean {
    if(!this.access_token){
      this.access_token = this.cookie.get('ACCESS_TOKEN');
      this.refresh_token = this.cookie.get('REFRESH_TOKEN');
    }
    return !!this.access_token || !!this.refresh_token;
  }

  login(payload: AuthInterface) {
    return this.http
      .post<TokenResponse>(`${this.API_URL}/auth/login`, payload, { withCredentials: true })
      .pipe(
        tap((val) => {
          this.saveTokens(val)
          console.log(val)

          this.router.navigate(['/']);
        }),
        catchError((err: HttpErrorResponse) =>{
          this.errorMessage = err.error.message
          
          return new Observable((subscriber) => {
            subscriber.next({ message: this.errorMessage, status: err.status, isError: true });
          });
        })
      );
  }

  register(payload: AuthInterface){
    return this.http
      .post<TokenResponse>(`${this.API_URL}/auth/register`, payload, { withCredentials: true })
      .pipe(
        tap(() => {
          this.login(payload)
        }),
        catchError((err: HttpErrorResponse) =>{
          this.errorMessage = err.error.message
          
          return new Observable((subscriber) => {
            subscriber.next({ message: this.errorMessage, status: err.status, isError: true });
          });
        })
      );
  }

  logout(){
    return this.http
    .post(`${this.API_URL}/auth/logout`,{}, { withCredentials: true })
    .pipe(
      catchError((err: HttpErrorResponse) =>{
        return throwError(() => err.error);        
      })
    )
    .subscribe(()=>{
      this.access_token = undefined;
  
      this.cookie.delete('ACCESS_TOKEN');
      this.router.navigate(['/auth']);
      console.log('logged out');
    })
  }

  refreshToken(){
    return this.http
    .post<TokenResponse>(`${this.API_URL}/auth/refresh-token`,{}, { withCredentials: true })
    .pipe(
      tap((val) => { this.saveTokens(val) }),
      catchError((err: HttpErrorResponse) =>{
        console.log('from refresh token');
        this.logout()
        return throwError(() => err);
      })
    )
  }

  getMe(){
    return this.http.
    get(`${this.API_URL}/user/me`)
  }

  private saveTokens(res: TokenResponse){
    console.log('triggered saveTokens');
    if(!this.access_token){
      this.access_token = res.access_token;
      this.cookie.set('ACCESS_TOKEN',this.access_token,{ secure: true, expires: new Date(Date.now() + 1000 * 60 * 15) });
    }
    if(!this.refresh_token){
      this.refresh_token = res.refresh_token;
      this.cookie.set('REFRESH_TOKEN',this.refresh_token, { secure: true });  
    }
  }
}
