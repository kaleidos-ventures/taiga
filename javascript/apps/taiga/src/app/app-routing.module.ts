/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

/* delete me */

// import { NgModule } from '@angular/core';
// import {
//   ActivatedRouteSnapshot,
//   BaseRouteReuseStrategy,
//   RouteReuseStrategy,
//   RouterModule,
//   Routes,
// } from '@angular/router';
// import { LogoutComponent } from './modules/auth/components/logout/logout.component';
// import { AuthFeatureLoginGuard } from './modules/auth/feature-login/auth-feature-login.guard';
// import { AuthGuard } from './modules/auth/guards/auth.guard';
// import { ProjectInvitationCTAGuard } from './modules/project/data-access/guards/project-invitation-cta.guard';
// import { ProjectInvitationGuard } from './modules/project/data-access/guards/project-invitation.guard';
// import { WorkspaceInvitationCTAGuard } from './modules/workspace/feature-detail/guards/workspace-invitation-cta.guard';
// import { provideTranslocoScope } from '@ngneat/transloco';
// import { provideState } from '@ngrx/store';
// import { provideEffects } from '@ngrx/effects';
// import { workspaceFeature } from './modules/workspace/feature-list/+state/reducers/workspace.reducer';
// import { WorkspaceEffects } from './modules/workspace/feature-list/+state/effects/workspace.effects';

// function isViewSetterKanbaStory(
//   future: ActivatedRouteSnapshot,
//   curr: ActivatedRouteSnapshot
// ) {
//   const story = ':slug/stories/:storyRef';
//   const kanban = ':slug/kanban';

//   const urls = [story, kanban];

//   const findUrl = (it: ActivatedRouteSnapshot): boolean => {
//     const finded = !!urls.find((url) => it.routeConfig?.path === url);

//     if (finded) {
//       return true;
//     } else if (it.parent) {
//       return findUrl(it.parent);
//     } else {
//       return false;
//     }
//   };

//   return findUrl(future) && findUrl(curr);
// }

// /*
// Add to your route if you want to control the if the component is reused in the same url:

// ```json
// data: {
//   reuseComponent: false,
// },
// ```
// */
// export class CustomReuseStrategy extends BaseRouteReuseStrategy {
//   public override shouldReuseRoute(
//     future: ActivatedRouteSnapshot,
//     curr: ActivatedRouteSnapshot
//   ) {
//     if (
//       future.routeConfig === curr.routeConfig &&
//       future.data.reuseComponent !== undefined
//     ) {
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-return
//       return future.data.reuseComponent;
//     }

//     if (isViewSetterKanbaStory(future, curr)) {
//       return true;
//     }

//     return future.routeConfig === curr.routeConfig;
//   }
// }

// const routes: Routes = [
//   {
//     path: 'login',
//     loadComponent: () =>
//       import('./modules/auth/feature-login/auth-feature-login.component').then(
//         (m) => m.AuthFeatureLoginComponent
//       ),
//     canActivate: [AuthFeatureLoginGuard],
//     data: {
//       noHeader: true,
//     },
//     providers: [provideTranslocoScope('auth')],
//   },
//   {
//     path: 'logout',
//     component: LogoutComponent,
//   },
//   {
//     path: 'signup',
//     loadComponent: () =>
//       import('./modules/auth/feature-login/auth-feature-login.component').then(
//         (m) => m.AuthFeatureLoginComponent
//       ),
//     canActivate: [AuthFeatureLoginGuard],
//     data: {
//       noHeader: true,
//     },
//     providers: [provideTranslocoScope('auth')],
//   },
//   {
//     path: 'reset-password',
//     loadChildren: () =>
//       import(
//         './modules/auth/feature-reset-password/auth-feature-reset-password.routes'
//       ).then((m) => m.AUTH_FEATURE_RESET_PASSWORD_ROUTES),
//     data: {
//       noHeader: true,
//     },
//     providers: [provideTranslocoScope('auth')],
//   },
//   {
//     path: 'accept-project-invitation/:token',
//     children: [],
//     canActivate: [ProjectInvitationCTAGuard],
//   },
//   {
//     path: 'project/:id/preview/:token',
//     children: [],
//     canActivate: [ProjectInvitationGuard],
//   },
//   {
//     path: 'accept-workspace-invitation/:token',
//     children: [],
//     canActivate: [WorkspaceInvitationCTAGuard],
//   },
//   {
//     path: '',
//     loadComponent: () =>
//       import(
//         './modules/workspace/feature-list/components/workspace/workspace.component'
//       ).then((m) => m.WorkspaceComponent),
//     canActivate: [AuthGuard],
//     // is lazy loaded?
//     providers: [
//       provideState(workspaceFeature),
//       provideEffects(WorkspaceEffects),
//     ],
//   },

//   // WORKSPACE
//   {
//     path: 'workspace/:id',
//     loadChildren: () =>
//       import(
//         './modules/workspace/feature-detail/workspace-feature-detail.module'
//       ).then((m) => m.WorkspaceFeatureDetailModule),
//     canActivate: [AuthGuard],
//   },

//   // PROJECT
//   {
//     path: 'new-project',
//     loadChildren: () =>
//       import('./modules/feature-new-project/feature-new-project.module').then(
//         (m) => m.FeatureNewProjectModule
//       ),
//     canActivate: [AuthGuard],
//   },
//   {
//     path: 'project/:id',
//     loadChildren: () =>
//       import(
//         './modules/project/feature-shell/project-feature-shell.module'
//       ).then((m) => m.ProjectFeatureShellModule),
//   },

//   {
//     path: '500',
//     loadChildren: () =>
//       import('./modules/errors/500/error-500.module').then(
//         (m) => m.Error500Module
//       ),
//     data: {
//       noHeader: true,
//     },
//   },
//   {
//     path: '403',
//     loadChildren: () =>
//       import('./modules/errors/403/error-403.module').then(
//         (m) => m.Error403Module
//       ),
//     data: {
//       noHeader: true,
//     },
//   },

//   {
//     path: '404',
//     loadChildren: () =>
//       import('./modules/errors/404/error-404.module').then(
//         (m) => m.Error404Module
//       ),
//     data: {
//       noHeader: true,
//     },
//   },
//   {
//     path: 'user-settings',
//     loadChildren: () =>
//       import(
//         './modules/feature-user-settings/feature-user-settings.module'
//       ).then((m) => m.FeatureUserSettingsModule),
//   },
//   {
//     path: '**',
//     redirectTo: '/404',
//   },
// ];

// @NgModule({
//   declarations: [],
//   imports: [
//     RouterModule.forRoot(routes, {
//       initialNavigation: 'enabledBlocking',
//       anchorScrolling: 'enabled',

//       paramsInheritanceStrategy: 'always',
//       onSameUrlNavigation: 'reload',
//       bindToComponentInputs: true,
//     }),
//   ],
//   providers: [{ provide: RouteReuseStrategy, useClass: CustomReuseStrategy }],
//   exports: [RouterModule],
// })
// export class AppRoutingModule {}
