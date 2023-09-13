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
import { ProjectApiService } from '@taiga/api';
import { ConfigService } from '@taiga/cdk/services/config';
import { ProjectInvitationInfo } from '@taiga/data';
import { EMPTY, of, throwError } from 'rxjs';
import { catchError, mergeMap, tap } from 'rxjs/operators';
import { AuthService } from '~/app/modules/auth/services/auth.service';
import { AppService } from '~/app/services/app.service';

export const ProjectInvitationGuard = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const http = inject(HttpClient);
  const config = inject(ConfigService);
  const appService = inject(AppService);
  const projectApiService = inject(ProjectApiService);

  const token = route.params.token as string;

  return http
    .get<ProjectInvitationInfo>(
      `${config.apiUrl}/projects/invitations/${token}`
    )
    .pipe(
      mergeMap((invitation: ProjectInvitationInfo) => {
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
              showToast(appService, 'errors.you_dont_have_permission_to_see');
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
        const projectId = route.params.id as string;

        // Handle 404 error
        if (httpResponse.status === 404 && authService.isLogged()) {
          return (function handle404Error() {
            return projectApiService.getProject(projectId).pipe(
              catchError((httpErrorResponse: HttpErrorResponse) => {
                if (httpErrorResponse.status === 403) {
                  showToast(
                    appService,
                    'errors.you_dont_have_permission_to_see'
                  );
                  void router.navigate(['/']);
                } else {
                  showToast(appService);
                  void router.navigate(['/404']);
                }
                return EMPTY;
              }),
              tap((project) => {
                if (project) {
                  void router.navigate([
                    '/project',
                    project.id,
                    project.slug,
                    'overview',
                  ]);
                }
                return EMPTY;
              })
            );
          })();
        }

        showToast(appService);
        // Handle other errors when logged in
        if (authService.isLogged()) {
          void router.navigate(['/']);
        } else {
          void router.navigate(['/login']);
        }

        return throwError(() => httpResponse);
      })
    );
};

export function showToast(
  appService: AppService,
  message = 'errors.invalid_token_toast_message'
) {
  appService.toastNotification({
    message,
    status: TuiNotification.Error,
    closeOnNavigation: false,
  });
}
