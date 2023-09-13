import { Routes } from '@angular/router';
import { AuthFeatureResetPasswordComponent } from './auth-feature-reset-password.component';
import { NewPasswordComponent } from './components/new-password.component';
import { ResetPasswordGuard } from './reset-password.guard';

export const AUTH_FEATURE_RESET_PASSWORD_ROUTES: Routes = [
  {
    path: '',
    component: AuthFeatureResetPasswordComponent,
  },
  {
    path: ':token',
    component: NewPasswordComponent,
    canActivate: [ResetPasswordGuard],
  },
];
