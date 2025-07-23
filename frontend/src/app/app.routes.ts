import { Routes } from '@angular/router';
import { userResolver } from './entities/user/user.resolver';
import { profileResolver } from './entities/profile/profile.resolver';
import { authGuard } from './core/auth/guards/auth.guard';


export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
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
        path: 'friends',
        loadComponent: () => import('./pages/friend-page/friend-page.component').then(m => m.FriendPageComponent)
      },
      {
        path: 'find-user',
        loadComponent: () => import('./pages/find-user-page/find-user-page.component').then(m => m.FindUserPageComponent)
      },
      {
        path: 'friend-requests',
        loadComponent: () => import('./pages/friend-request-page/friend-request-page.component').then(m => m.FriendRequestPageComponent)
      }
    ],
  },
  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
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
