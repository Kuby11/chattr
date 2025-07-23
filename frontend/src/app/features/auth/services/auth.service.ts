import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, inject, Injectable, OnInit } from '@angular/core';
import { AuthInterface, TokenResponse } from '../interfaces';
import { catchError, interval, Observable, Subscription, tap, throwError } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly cookie = inject(CookieService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly API_URL = 'http://localhost:3000';
  private readonly subscription?: Subscription

  errorMessage: string | null = null
  access_token = this.cookie.get('ACCESS_TOKEN');
  refresh_token = this.cookie.get('REFRESH_TOKEN');

  constructor() {
    //todo improve token refreshing
  
    this.subscription = interval(1000 * 60 * 3)
    .subscribe(() => {
      if(this.isAuth()){
        this.refreshToken()
        .subscribe()
      }
    });

    this.destroyRef.onDestroy(() => {
      this.subscription?.unsubscribe()
    });
  }

  isAuth(): boolean {
    if(!this.access_token) {
      return !!this.cookie.get('ACCESS_TOKEN')
    }
    return !!this.access_token
  }

  login(payload: AuthInterface) {
    return this.http
      .post<TokenResponse>(`${this.API_URL}/auth/login`, payload, { withCredentials: true })
      .pipe(
        tap((val) => {
          this.saveTokens(val)
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
        catchError((err: HttpErrorResponse) =>{
          this.errorMessage = err.error.message
          this.login(payload)
          
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
      tap(()=>{
        console.log('logout')
        this.cookie.delete('ACCESS_TOKEN');
        this.router.navigate(['/auth']);
      }),
      catchError((err: HttpErrorResponse) =>{
        return throwError(() => err.error);        
      })
    )
  }

  refreshToken(){
    return this.http
    .post<TokenResponse>(`${this.API_URL}/auth/refresh-token`,{}, { withCredentials: true })
    .pipe(
      tap((val) => { this.saveTokens(val) }),
      catchError((err: HttpErrorResponse) =>{
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
    this.cookie.set('ACCESS_TOKEN',res.access_token,{ secure: true, expires: new Date(Date.now() + 1000 * 60 * 15) });
  }
}
