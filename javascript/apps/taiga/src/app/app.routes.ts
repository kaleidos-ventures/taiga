import { Routes } from '@angular/router';
import { provideTranslocoScope } from '@ngneat/transloco';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { LogoutComponent } from './modules/auth/components/logout/logout.component';
import { AuthFeatureLoginGuard } from './modules/auth/feature-login/auth-feature-login.guard';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { ProjectInvitationCTAGuard } from './modules/project/data-access/guards/project-invitation-cta.guard';
import { ProjectInvitationGuard } from './modules/project/data-access/guards/project-invitation.guard';
import { WorkspaceInvitationCTAGuard } from './modules/workspace/feature-detail/guards/workspace-invitation-cta.guard';
import { WorkspaceEffects } from './modules/workspace/feature-list/+state/effects/workspace.effects';
import { workspaceFeature } from './modules/workspace/feature-list/+state/reducers/workspace.reducer';

export const APP_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./modules/auth/feature-login/auth-feature-login.component').then(
        (m) => m.AuthFeatureLoginComponent
      ),
    canActivate: [AuthFeatureLoginGuard],
    data: {
      noHeader: true,
    },
    providers: [provideTranslocoScope('auth')],
  },
  {
    path: 'logout',
    component: LogoutComponent,
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./modules/auth/feature-login/auth-feature-login.component').then(
        (m) => m.AuthFeatureLoginComponent
      ),
    canActivate: [AuthFeatureLoginGuard],
    data: {
      noHeader: true,
    },
    providers: [provideTranslocoScope('auth')],
  },
  {
    path: 'reset-password',
    loadChildren: () =>
      import(
        './modules/auth/feature-reset-password/auth-feature-reset-password.routes'
      ).then((m) => m.AUTH_FEATURE_RESET_PASSWORD_ROUTES),
    data: {
      noHeader: true,
    },
    providers: [provideTranslocoScope('auth')],
  },
  {
    path: 'accept-project-invitation/:token',
    children: [],
    canActivate: [ProjectInvitationCTAGuard],
  },
  {
    path: 'project/:id/preview/:token',
    children: [],
    canActivate: [ProjectInvitationGuard],
  },
  {
    path: 'accept-workspace-invitation/:token',
    children: [],
    canActivate: [WorkspaceInvitationCTAGuard],
  },
  // {
  //   path: '',
  //   loadComponent: () =>
  //     import(
  //       './modules/workspace/feature-list/components/workspace/workspace.component'
  //     ).then((m) => m.WorkspaceComponent),
  //   canActivate: [AuthGuard],
  //   // is lazy loaded?
  //   providers: [
  //     provideState(workspaceFeature),
  //     provideEffects(WorkspaceEffects),
  //   ],
  // },

  // // WORKSPACE
  // {
  //   path: 'workspace/:id',
  //   loadChildren: () =>
  //     import(
  //       './modules/workspace/feature-detail/workspace-feature-detail.module'
  //     ).then((m) => m.WorkspaceFeatureDetailModule),
  //   canActivate: [AuthGuard],
  // },

  // // PROJECT
  // {
  //   path: 'new-project',
  //   loadChildren: () =>
  //     import('./modules/feature-new-project/feature-new-project.module').then(
  //       (m) => m.FeatureNewProjectModule
  //     ),
  //   canActivate: [AuthGuard],
  // },
  // {
  //   path: 'project/:id',
  //   loadChildren: () =>
  //     import(
  //       './modules/project/feature-shell/project-feature-shell.module'
  //     ).then((m) => m.ProjectFeatureShellModule),
  // },

  // {
  //   path: '500',
  //   loadChildren: () =>
  //     import('./modules/errors/500/error-500.module').then(
  //       (m) => m.Error500Module
  //     ),
  //   data: {
  //     noHeader: true,
  //   },
  // },
  // {
  //   path: '403',
  //   loadChildren: () =>
  //     import('./modules/errors/403/error-403.module').then(
  //       (m) => m.Error403Module
  //     ),
  //   data: {
  //     noHeader: true,
  //   },
  // },

  // {
  //   path: '404',
  //   loadChildren: () =>
  //     import('./modules/errors/404/error-404.module').then(
  //       (m) => m.Error404Module
  //     ),
  //   data: {
  //     noHeader: true,
  //   },
  // },
  // {
  //   path: 'user-settings',
  //   loadChildren: () =>
  //     import(
  //       './modules/feature-user-settings/feature-user-settings.module'
  //     ).then((m) => m.FeatureUserSettingsModule),
  // },
  // {
  //   path: '**',
  //   redirectTo: '/404',
  // },
];
