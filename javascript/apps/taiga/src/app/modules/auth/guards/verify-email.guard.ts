/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService, UsersApiService } from '@taiga/api';
import { ConfigService } from '@taiga/cdk/services/config';
import {
  Auth,
  ProjectInvitationInfo,
  WorkspaceInvitationInfo,
  User,
} from '@taiga/data';
import { throwError } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { AppService } from '~/app/services/app.service';
import { RevokeInvitationService } from '~/app/services/revoke-invitation.service';
import {
  loginSuccess,
  loginProjectInvitationSuccess,
  loginWorkspaceInvitationSuccess,
} from '../data-access/+state/actions/auth.actions';
import { AuthService } from '../services/auth.service';
type ProjectInvitationVerification = Pick<
  ProjectInvitationInfo,
  'project' | 'status'
>;
type WorkspaceInvitationVerification = Pick<
  WorkspaceInvitationInfo,
  'workspace' | 'status'
>;
type VerificationData = {
  auth: Auth;
  projectInvitation: ProjectInvitationVerification;
  workspaceInvitation: WorkspaceInvitationVerification;
};

export const VerifyEmailGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => {
  const http = inject(HttpClient);
  const config = inject(ConfigService);
  const appService = inject(AppService);
  const router = inject(Router);
  const store = inject(Store);
  const authService = inject(AuthService);
  const usersApiService = inject(UsersApiService);
  const projectApiService = inject(ProjectApiService);
  const revokeInvitationService = inject(RevokeInvitationService);

  const verifyParam = route.params.path as string;
  return http
    .post<{
      auth: Auth;
      projectInvitation: ProjectInvitationVerification;
      workspaceInvitation: WorkspaceInvitationVerification;
    }>(`${config.apiUrl}/users/verify`, {
      token: verifyParam,
    })
    .pipe(
      mergeMap((verification: VerificationData) => {
        authService.setAuth(verification.auth);
        return usersApiService.me().pipe(
          map((user: User) => {
            authService.setUser(user);
            return { user, verification };
          })
        );
      }),
      tap(({ verification }) => {
        projectApiService
          .getProject(verification.projectInvitation?.project?.id)
          .pipe(
            catchError((httpResponse: HttpErrorResponse) => {
              revokeInvitationService.verifyEmailRevokeError(httpResponse);
              return throwError(() => httpResponse);
            })
          );
      }),
      map(({ user, verification }) => {
        const projectId = verification.projectInvitation?.project?.id;
        const workspaceId = verification.workspaceInvitation?.workspace?.id;
        const data = {
          user,
          auth: verification.auth,
        };
        if (projectId) {
          const projectSlug = verification.projectInvitation?.project?.slug;
          store.dispatch(
            loginProjectInvitationSuccess({
              next: `/project/${projectId}/${projectSlug}`,
              ...data,
            })
          );
        } else if (workspaceId) {
          const workspaceSlug =
            verification.workspaceInvitation?.workspace?.slug;
          store.dispatch(
            loginWorkspaceInvitationSuccess({
              next: `/workspace/${workspaceId}/${workspaceSlug}`,
              ...data,
            })
          );
        } else {
          store.dispatch(loginSuccess(data));
        }
        return true;
      }),
      catchError((httpResponse: HttpErrorResponse) => {
        if (httpResponse.status === 404) {
          appService.errorManagement(httpResponse, {
            404: {
              type: 'toast',
              options: {
                label: 'verify.errors.invalid_token_label',
                message: 'verify.errors.invalid_token_message',
                status: TuiNotification.Error,
                scope: 'auth',
              },
            },
          });
          void router.navigate(['/signup']);
        } else if (httpResponse.status === 400) {
          void router.navigate(['/login']);
        }
        return throwError(() => httpResponse);
      })
    );
};
