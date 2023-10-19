/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  BaseRouteReuseStrategy,
  RouteReuseStrategy,
  RouterModule,
  Routes,
} from '@angular/router';
import { LogoutComponent } from './modules/auth/components/logout/logout.component';
import { AuthFeatureLoginGuard } from './modules/auth/feature-login/auth-feature-login.guard';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { ProjectInvitationCTAGuard } from './modules/project/data-access/guards/project-invitation-cta.guard';
import { ProjectInvitationGuard } from './modules/project/data-access/guards/project-invitation.guard';
import { WorkspaceInvitationCTAGuard } from './modules/workspace/feature-detail/guards/workspace-invitation-cta.guard';

function isViewSetterKanbaStory(
  future: ActivatedRouteSnapshot,
  curr: ActivatedRouteSnapshot
) {
  const story = ':slug/stories/:storyRef';
  const kanban = ':slug/kanban';
  const workflow = ':slug/kanban/:workflow';

  const urls = [story, kanban, workflow];

  const findUrl = (it: ActivatedRouteSnapshot): boolean => {
    const finded = !!urls.find((url) => it.routeConfig?.path === url);

    if (finded) {
      return true;
    } else if (it.parent) {
      return findUrl(it.parent);
    } else {
      return false;
    }
  };

  return findUrl(future) && findUrl(curr);
}

/*
Add to your route if you want to control the if the component is reused in the same url:

```json
data: {
  reuseComponent: false,
},
```
*/
export class CustomReuseStrategy extends BaseRouteReuseStrategy {
  public override shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot
  ) {
    if (
      future.routeConfig === curr.routeConfig &&
      future.data.reuseComponent !== undefined
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return future.data.reuseComponent;
    }

    if (isViewSetterKanbaStory(future, curr)) {
      return true;
    }

    return future.routeConfig === curr.routeConfig;
  }
}

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () =>
      import('./modules/auth/feature-login/auth-feature-login.module').then(
        (m) => m.AuthFeatureLoginModule
      ),
    canActivate: [AuthFeatureLoginGuard],
    data: {
      noHeader: true,
    },
  },
  {
    path: 'logout',
    component: LogoutComponent,
  },
  {
    path: 'signup',
    loadChildren: () =>
      import('./modules/auth/feature-sign-up/auth-feature-sign-up.module').then(
        (m) => m.AuthFeatureSignUpModule
      ),
    canActivate: [AuthFeatureLoginGuard],
    data: {
      noHeader: true,
    },
  },
  {
    path: 'reset-password',
    loadChildren: () =>
      import(
        './modules/auth/feature-reset-password/auth-feature-reset-password.module'
      ).then((m) => m.AuthFeatureResetPasswordModule),
    data: {
      noHeader: true,
    },
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
  {
    path: '',
    loadChildren: () =>
      import(
        './modules/workspace/feature-list/workspace-feature-list.module'
      ).then((m) => m.WorkspaceFeatureListModule),
    canActivate: [AuthGuard],
  },

  // WORKSPACE
  {
    path: 'workspace/:id',
    loadChildren: () =>
      import(
        './modules/workspace/feature-detail/workspace-feature-detail.module'
      ).then((m) => m.WorkspaceFeatureDetailModule),
    canActivate: [AuthGuard],
  },

  // PROJECT
  {
    path: 'new-project',
    loadChildren: () =>
      import('./modules/feature-new-project/feature-new-project.module').then(
        (m) => m.FeatureNewProjectModule
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'project/:id',
    loadChildren: () =>
      import(
        './modules/project/feature-shell/project-feature-shell.module'
      ).then((m) => m.ProjectFeatureShellModule),
  },

  {
    path: '500',
    loadChildren: () =>
      import('./modules/errors/500/error-500.module').then(
        (m) => m.Error500Module
      ),
    data: {
      noHeader: true,
    },
  },
  {
    path: '403',
    loadChildren: () =>
      import('./modules/errors/403/error-403.module').then(
        (m) => m.Error403Module
      ),
    data: {
      noHeader: true,
    },
  },

  {
    path: '404',
    loadChildren: () =>
      import('./modules/errors/404/error-404.module').then(
        (m) => m.Error404Module
      ),
    data: {
      noHeader: true,
    },
  },
  {
    path: 'user-settings',
    loadChildren: () =>
      import(
        './modules/feature-user-settings/feature-user-settings.module'
      ).then((m) => m.FeatureUserSettingsModule),
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forRoot(routes, {
      paramsInheritanceStrategy: 'always',
      initialNavigation: 'enabledBlocking',
      anchorScrolling: 'enabled',
      onSameUrlNavigation: 'reload',
      bindToComponentInputs: true,
    }),
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: CustomReuseStrategy }],
  exports: [RouterModule],
})
export class AppRoutingModule {}
