import { Routes } from '@angular/router';
import { ChatLayoutComponent } from './layouts/main-layout/chat-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { NotFoundComponent } from './features/not-found-page/not-found.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { HomePageComponent } from './pages/home/home-page.component';
import { ChatPageComponent } from './pages/chat-page/chat-page.component';
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
