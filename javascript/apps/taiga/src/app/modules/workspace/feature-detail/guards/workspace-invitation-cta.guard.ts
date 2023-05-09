/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { TuiNotification } from '@taiga-ui/core';
import { ConfigService } from '@taiga/core';
import {
  WorkspaceInvitationInfo,
  InvitationWorkspaceMember,
} from '@taiga/data';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { AuthService } from '~/app/modules/auth/services/auth.service';
import { AppService } from '~/app/services/app.service';

export const WorkspaceInvitationCTAGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const http = inject(HttpClient);
  const config = inject(ConfigService);
  const appService = inject(AppService);

  const token = route.params.token as string;

  return http
    .get<WorkspaceInvitationInfo>(
      `${config.apiUrl}/workspaces/invitations/${token}`
    )
    .pipe(
      mergeMap((invitation: WorkspaceInvitationInfo) => {
        if (authService.isLogged()) {
          return http
            .post<InvitationWorkspaceMember>(
              `${config.apiUrl}/workspaces/invitations/${token}/accept`,
              {}
            )
            .pipe(
              map(() => {
                return router.parseUrl(
                  `/workspace/${invitation.workspace.id}/${invitation.workspace.slug}`
                );
              }),
              catchError(() => {
                // TODO revoke
                return of(false);
              })
            );
        } else {
          if (invitation.existingUser) {
            const urlTree = router.parseUrl('/login');
            urlTree.queryParams = {
              next: `/workspace/${invitation.workspace.id}/${invitation.workspace.slug}`,
              email: invitation.email,
              acceptWorkspaceInvitation: 'true',
              workspaceInvitationToken: token,
              nextWorkspaceId: invitation.workspace.id,
              availableLogins: invitation.availableLogins.join(','),
            };

            return of(urlTree);
          } else {
            // TODO revoke
            const urlTree = router.parseUrl('/signup');
            urlTree.queryParams = {
              workspace: invitation.workspace.name,
              email: invitation.email,
              acceptWorkspaceInvitation: 'true',
              workspaceInvitationToken: token,
            };

            return of(urlTree);
          }
        }
      }),
      catchError(() => {
        appService.toastNotification({
          message: 'errors.invalid_token_toast_message',
          status: TuiNotification.Error,
          autoClose: false,
          closeOnNavigation: false,
        });

        if (authService.isLogged()) {
          return of(router.parseUrl('/'));
        }

        return of(router.parseUrl('/login'));
      })
    );
};
