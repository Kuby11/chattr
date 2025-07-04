import { Routes } from '@angular/router';
import { ChatLayoutComponent } from './layouts/main-layout/chat-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { NotFoundComponent } from './features/not-found-page/not-found.component';
import { HomePageComponent } from './pages/home/home-page.component';
import { userResolver } from './entities/user/user.resolver';
import { profileResolver } from './entities/profile/profile.resolver';
import { authGuard } from './features/auth/guards/auth.guard';
import { authPageGuard } from './features/auth/guards/auth-page.guard';

export const routes: Routes = [
  {
    path: '',
    component: ChatLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: HomePageComponent,
        loadChildren: () => import('./pages/home/home-page.component').then((m)=> m.HomePageComponent)
      },
      {
        path: 'settings',
        loadChildren: () => import('./pages/settings/settings.component').then((m) => m.SettingsComponent), 
      },
      {
        path: 'profile/:id',
        loadChildren: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
        resolve: {
          profile: profileResolver,
          user: userResolver,
        },
      },
      {
        path: 'chats',
        loadChildren: () => import('./pages/chat-page/chat-page.component').then((m) => m.ChatPageComponent),
      },
      {
        path: 'friend',
        loadChildren: () => import('./pages/friend-page/friend-page.component').then((m) => m.FriendPageComponent),
      },
    ],
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivate: [authPageGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./pages/login/login.component').then((m) => m.LoginComponent)
      },
      {
        path: 'register',
        loadChildren: () => import('./pages/register/register.component').then((m) => m.RegisterComponent)
      },
    ],
  },
  {
    path: '**',
    component: NotFoundComponent,
    loadChildren: () => import('./features/not-found-page/not-found.component').then((m) => m.NotFoundComponent)
  },
];
