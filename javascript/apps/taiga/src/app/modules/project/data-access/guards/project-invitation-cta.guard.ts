/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService } from '@taiga/api';
import { ConfigService } from '@taiga/core';
import { InvitationInfo, Project } from '@taiga/data';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { AuthService } from '~/app/modules/auth/services/auth.service';
import { AppService } from '~/app/services/app.service';
import { RevokeInvitationService } from '~/app/services/revoke-invitation.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectInvitationCTAGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private config: ConfigService,
    private appService: AppService,
    private revokeInvitationService: RevokeInvitationService,
    private projectApiService: ProjectApiService
  ) {}

  public canActivate(route: ActivatedRouteSnapshot) {
    const token = route.params.token as string;

    return this.http
      .get<InvitationInfo>(
        `${this.config.apiUrl}/projects/invitations/${token}`
      )
      .pipe(
        mergeMap((invitation: InvitationInfo) => {
          return this.projectApiService.getProject(invitation.project.id).pipe(
            catchError(() => {
              return of(null);
            }),
            mergeMap((project) => {
              if (this.authService.isLogged()) {
                return this.http
                  .post<{ id: Project['id'] }>(
                    `${this.config.apiUrl}/projects/invitations/${token}/accept`,
                    {}
                  )
                  .pipe(
                    map(() => {
                      return this.router.parseUrl(
                        `/project/${invitation.project.id}/${invitation.project.slug}`
                      );
                    }),
                    catchError((httpResponse: HttpErrorResponse) => {
                      return this.revokeInvitationService.invitationCtaRevokeError(
                        invitation,
                        httpResponse
                      );
                    })
                  );
              } else {
                if (invitation.existingUser) {
                  const urlTree = this.router.parseUrl('/login');
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
                      this.appService.toastNotification({
                        message: 'errors.invitation_no_longer_valid',
                        status: TuiNotification.Error,
                        autoClose: false,
                        closeOnNavigation: false,
                      });
                      return of(
                        this.router.parseUrl(
                          `/project/${invitation.project.id}/${invitation.project.slug}`
                        )
                      );
                    } else {
                      this.appService.toastNotification({
                        message: 'errors.invitation_no_longer_valid',
                        status: TuiNotification.Error,
                        autoClose: false,
                        closeOnNavigation: false,
                      });
                      const urlTree = this.router.parseUrl('/signup');

                      return of(urlTree);
                    }
                  } else {
                    const urlTree = this.router.parseUrl('/signup');
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
        catchError((httpResponse: HttpErrorResponse) => {
          let message;
          if (httpResponse.status === 404) {
            message = 'errors.generic_deleted_project';
          } else {
            message = 'errors.invalid_token_toast_message';
          }

          this.appService.toastNotification({
            message: message,
            status: TuiNotification.Error,
            autoClose: false,
            closeOnNavigation: false,
          });

          if (httpResponse.status === 404) {
            return of(this.router.parseUrl('/404'));
          } else if (this.authService.isLogged()) {
            return of(this.router.parseUrl('/'));
          }

          return of(this.router.parseUrl('/login'));
        })
      );
  }
}
