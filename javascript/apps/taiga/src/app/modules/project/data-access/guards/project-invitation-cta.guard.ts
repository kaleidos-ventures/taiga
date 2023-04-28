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
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService } from '@taiga/api';
import { ConfigService } from '@taiga/core';
import { InvitationInfo, Project } from '@taiga/data';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { AuthService } from '~/app/modules/auth/services/auth.service';
import { AppService } from '~/app/services/app.service';
import { RevokeInvitationService } from '~/app/services/revoke-invitation.service';

export const ProjectInvitationCTAGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const http = inject(HttpClient);
  const config = inject(ConfigService);
  const appService = inject(AppService);
  const revokeInvitationService = inject(RevokeInvitationService);
  const projectApiService = inject(ProjectApiService);

  const token = route.params.token as string;

  return http
    .get<InvitationInfo>(`${config.apiUrl}/projects/invitations/${token}`)
    .pipe(
      mergeMap((invitation: InvitationInfo) => {
        return projectApiService.getProject(invitation.project.id).pipe(
          catchError(() => {
            return of(null);
          }),
          mergeMap((project) => {
            if (authService.isLogged()) {
              return http
                .post<{ id: Project['id'] }>(
                  `${config.apiUrl}/projects/invitations/${token}/accept`,
                  {}
                )
                .pipe(
                  map(() => {
                    return router.parseUrl(
                      `/project/${invitation.project.id}/${invitation.project.slug}`
                    );
                  }),
                  catchError((httpResponse: HttpErrorResponse) => {
                    return revokeInvitationService.invitationCtaRevokeError(
                      invitation,
                      httpResponse
                    );
                  })
                );
            } else {
              if (invitation.existingUser) {
                const urlTree = router.parseUrl('/login');
                urlTree.queryParams = {
                  next: `/project/${invitation.project.id}/${invitation.project.slug}`,
                  email: invitation.email,
                  acceptProjectInvitation: 'true',
                  projectInvitationToken: token,
                  nextProjectId: invitation.project.id,
                  availableLogins: invitation.availableLogins.join(','),
                };

                return of(urlTree);
              } else {
                if (invitation.status === 'revoked') {
                  if (project && project.userPermissions.length > 0) {
                    appService.toastNotification({
                      message: 'errors.invitation_no_longer_valid',
                      status: TuiNotification.Error,
                      autoClose: false,
                      closeOnNavigation: false,
                    });
                    return of(
                      router.parseUrl(
                        `/project/${invitation.project.id}/${invitation.project.slug}`
                      )
                    );
                  } else {
                    appService.toastNotification({
                      message: 'errors.invitation_no_longer_valid',
                      status: TuiNotification.Error,
                      autoClose: false,
                      closeOnNavigation: false,
                    });
                    const urlTree = router.parseUrl('/signup');

                    return of(urlTree);
                  }
                } else {
                  const urlTree = router.parseUrl('/signup');
                  urlTree.queryParams = {
                    project: invitation.project.name,
                    email: invitation.email,
                    acceptProjectInvitation: 'true',
                    projectInvitationToken: token,
                  };

                  return of(urlTree);
                }
              }
            }
          })
        );
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
