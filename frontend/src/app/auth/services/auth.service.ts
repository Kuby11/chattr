import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthInterface, TokenResponse } from '../interfaces';
import { catchError, Observable, tap, throwError } from 'rxjs';
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

  errorMessage: string | null = null

  access_token: string | null = null;
  refresh_token: string | null = null;

  isAuth(): boolean {
    if(!this.access_token){
      this.access_token = this.cookie.get('ACCESS_TOKEN');
      this.refresh_token = this.cookie.get('REFRESH_TOKEN');
    }
    return !!this.access_token;
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
        return throwError(() => err);        
      })
    )
    .subscribe(()=>{
      this.access_token = null;
  
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
    this.access_token = res.access_token;
    this.refresh_token = res.refresh_token;

    this.cookie.set('ACCESS_TOKEN',this.access_token,{ secure: true, expires: new Date(Date.now() + 1000 * 60 * 15) });
    this.cookie.set('REFRESH_TOKEN',this.refresh_token, { secure: true });
  }
}
