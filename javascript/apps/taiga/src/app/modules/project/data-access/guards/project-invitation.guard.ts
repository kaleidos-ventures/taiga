/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { TuiNotification } from '@taiga-ui/core';
import { ConfigService } from '@taiga/core';
import { InvitationInfo } from '@taiga/data';
import { of, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { AuthService } from '~/app/modules/auth/services/auth.service';
import { AppService } from '~/app/services/app.service';

export const ProjectInvitationGuard = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const http = inject(HttpClient);
  const config = inject(ConfigService);
  const appService = inject(AppService);

  const token = route.params.token as string;

  return http
    .get<InvitationInfo>(`${config.apiUrl}/projects/invitations/${token}`)
    .pipe(
      mergeMap((invitation: InvitationInfo) => {
        if (invitation.existingUser) {
          if (authService.isLogged()) {
            void router.navigate(
              ['/project/', invitation.project.id, invitation.project.slug],
              {
                state: { invite: invitation.status },
              }
            );
          } else {
            void router.navigate(['/login'], {
              queryParams: {
                next: `/project/${invitation.project.id}/${invitation.project.slug}`,
                projectInvitationToken: token,
                acceptProjectInvitation: false,
                invitationStatus: invitation.status,
                nextProjectId: invitation.project.id,
                availableLogins: invitation.availableLogins.join(','),
              },
            });
          }
        } else {
          if (invitation.project.anonUserCanView) {
            void router.navigate(
              ['/project/', invitation.project.id, invitation.project.slug],
              {
                state: { invite: invitation.status },
              }
            );
            return of(true);
          } else {
            if (invitation.status === 'revoked') {
              appService.toastNotification({
                message: 'errors.you_dont_have_permission_to_see',
                status: TuiNotification.Error,
                autoClose: false,
                closeOnNavigation: false,
              });
              void router.navigate(['/signup']);
            } else {
              void router.navigate(['/signup'], {
                queryParams: {
                  project: invitation.project.name,
                  email: invitation.email,
                  acceptProjectInvitation: false,
                  projectInvitationToken: token,
                },
              });
            }
          }
        }
        return of(true);
      }),
      catchError((httpResponse: HttpErrorResponse) => {
        if (httpResponse.status === 404) {
          void router.navigate(['/404']);
        } else if (authService.isLogged()) {
          void router.navigate(['/']);
        } else {
          void router.navigate(['/login']);
        }
        let message;
        if (httpResponse.status === 404) {
          message = 'errors.generic_deleted_project';
        } else {
          message = 'errors.invalid_token_toast_message';
        }

        appService.toastNotification({
          message: message,
          status: TuiNotification.Error,
          closeOnNavigation: false,
        });
        return throwError(() => httpResponse);
      })
    );
};
