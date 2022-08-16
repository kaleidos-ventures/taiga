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
import { ConfigService } from '@taiga/core';
import { genericResponseError, InvitationInfo, Project } from '@taiga/data';
import { of, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { AuthService } from '~/app/modules/auth/services/auth.service';
import { AppService } from '~/app/services/app.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectInvitationCTAGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private config: ConfigService,
    private appService: AppService
  ) {}

  public canActivate(route: ActivatedRouteSnapshot) {
    const token = route.params.token as string;

    return this.http
      .get<InvitationInfo>(
        `${this.config.apiUrl}/projects/invitations/${token}`
      )
      .pipe(
        mergeMap((invitation: InvitationInfo) => {
          if (this.authService.isLogged()) {
            return this.http
              .post<{ slug: Project['slug'] }>(
                `${this.config.apiUrl}/projects/invitations/${token}/accept`,
                {}
              )
              .pipe(
                mergeMap(() => {
                  void this.router.navigate([
                    `/project/${invitation.project.slug}`,
                  ]);
                  return of(true);
                }),
                catchError((httpResponse: HttpErrorResponse) => {
                  if (
                    httpResponse.status === 400 &&
                    (httpResponse.error as genericResponseError).error
                      .detail === 'invitation-revoked-error'
                  ) {
                    this.appService.toastNotification({
                      message: 'errors.invitation_no_longer_valid',
                      status: TuiNotification.Error,
                      autoClose: false,
                      closeOnNavigation: false,
                    });
                    if (invitation.project.isAnon) {
                      void this.router.navigate([
                        `/project/${invitation.project.slug}`,
                      ]);
                    }
                    return throwError(httpResponse);
                  }
                  void this.router.navigate(['/']);
                  return throwError(httpResponse);
                })
              );
          } else {
            if (invitation.existingUser) {
              void this.router.navigate(['/login'], {
                queryParams: {
                  next: `/project/${invitation.project.slug}`,
                  acceptProjectInvitation: true,
                  projectInvitationToken: token,
                  isNextAnonProject: invitation.project.isAnon,
                },
              });
            } else {
              void this.router.navigate(['/signup'], {
                queryParams: {
                  project: invitation.project.name,
                  email: invitation.email,
                  acceptProjectInvitation: true,
                  projectInvitationToken: token,
                  isNextAnonProject: invitation.project.isAnon,
                },
              });
            }
            return of(true);
          }
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
            autoClose: false,
            closeOnNavigation: false,
          });
          return throwError(httpResponse);
        })
      );
  }
}
