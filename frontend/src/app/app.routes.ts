import { Routes } from '@angular/router';
import { userResolver } from './entities/user/user.resolver';
import { profileResolver } from './entities/profile/profile.resolver';
import { authGuard } from './features/auth/guards/auth.guard';
import { authPageGuard } from './features/auth/guards/auth-page.guard';


export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/chat-layout.component').then(m => m.ChatLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home-page.component').then(m => m.HomePageComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
      },
      {
        path: 'profile/:id',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
        resolve: {
          profile: profileResolver,
          user: userResolver
        }
      },
      {
        path: 'chats',
        loadComponent: () => import('./pages/chat-page/chat-page.component').then(m => m.ChatPageComponent),
      },
      {
        path: "friends",
        loadComponent: () => import('./pages/friend-page/friend-page.component').then(m => m.FriendPageComponent)
      }
    ],
  },
  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    canActivate: [authPageGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found-page/not-found.component').then(m => m.NotFoundComponent),
  },
];
