import { Routes } from '@angular/router';
import { ChatLayoutComponent } from './layouts/chat-layout/chat-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { authGuard } from './auth/guards/auth.guard';
import { LoginComponent } from './layouts/auth-layout/login/login.component';
import { RegisterComponent } from './layouts/auth-layout/register/register.component';
import { NotFoundComponent } from './shared/pages/not-found/not-found.component';
import { SettingsComponent } from './layouts/chat-layout/pages/settings/settings.component';
import { ProfileComponent } from './layouts/chat-layout/pages/profile/profile.component';
import { authPageGuard } from './auth/guards/auth-page.guard';
import { HomePageComponent } from './layouts/chat-layout/pages/home-page/home-page.component';
import { ChatPageComponent } from './layouts/chat-layout/pages/chat-page/chat-page.component';
import { userResolver } from './features/resolvers/user.resolver';
import { profileResolver } from './features/resolvers/profile.resolver';

export const routes: Routes = [
  {
    path: '',
    component: ChatLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: HomePageComponent,
      },
      {
        path: 'settings',
        component: SettingsComponent,
      },
      {
        path: 'profile/:id',
        component: ProfileComponent,
        resolve: {
          profile: profileResolver,
          user: userResolver
        }
      },
      {
        path: 'chats',
        component: ChatPageComponent,
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
        component: LoginComponent,
      },
      {
        path: 'register',
        component: RegisterComponent,
      },
    ],
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
