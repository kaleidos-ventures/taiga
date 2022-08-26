/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService } from '@taiga/api';
import { ConfigService } from '@taiga/core';
import { InvitationInfo } from '@taiga/data';
import { of, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { AuthService } from '~/app/modules/auth/services/auth.service';
import { AppService } from '~/app/services/app.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectInvitationGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private config: ConfigService,
    private appService: AppService,
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
          return this.projectApiService
            .getProject(invitation.project.slug)
            .pipe(
              catchError(() => {
                return of(null);
              }),
              mergeMap((project) => {
                if (invitation.existingUser) {
                  if (this.authService.isLogged()) {
                    void this.router.navigate(
                      ['/project/', invitation.project.slug],
                      {
                        state: { invite: invitation.status },
                      }
                    );
                  } else {
                    void this.router.navigate(['/login'], {
                      queryParams: {
                        next: `/project/${invitation.project.slug}`,
                        projectInvitationToken: token,
                        acceptProjectInvitation: false,
                        nextHasPermission:
                          project && project.userPermissions.length > 0,
                        invitationStatus: invitation.status,
                      },
                    });
                  }
                } else {
                  if (project && project.userPermissions.length > 0) {
                    void this.router.navigate(
                      ['/project/', invitation.project.slug],
                      {
                        state: { invite: invitation.status },
                      }
                    );
                    return of(true);
                  } else {
                    if (invitation.status === 'revoked') {
                      this.appService.toastNotification({
                        message: 'errors.you_dont_have_permission_to_see',
                        status: TuiNotification.Error,
                        autoClose: false,
                        closeOnNavigation: false,
                      });
                      void this.router.navigate(['/signup'], {
                        queryParams: {
                          email: invitation.email,
                          acceptProjectInvitation: false,
                          projectInvitationToken: token,
                          nextHasPermission:
                            project && project.userPermissions.length > 0,
                        },
                      });
                    } else {
                      void this.router.navigate(['/signup'], {
                        queryParams: {
                          project: invitation.project.name,
                          email: invitation.email,
                          acceptProjectInvitation: false,
                          projectInvitationToken: token,
                          nextHasPermission:
                            project && project.userPermissions.length > 0,
                        },
                      });
                    }
                  }
                }
                return of(true);
              })
            );
        }),
        catchError((httpResponse: HttpErrorResponse) => {
          if (this.authService.isLogged()) {
            void this.router.navigate(['/']);
          } else {
            void this.router.navigate(['/login']);
          }
          this.appService.toastNotification({
            message: 'errors.invalid_token_toast_message',
            status: TuiNotification.Error,
            closeOnNavigation: false,
          });
          return throwError(httpResponse);
        })
      );
  }
}
