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
import { InvitationInfo } from '@taiga/data';
import { of, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { AuthService } from '~/app/modules/auth/data-access/services/auth.service';
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
          if (invitation.existingUser) {
            if (this.authService.isLogged()) {
              void this.router.navigate([
                `/project/${invitation.project.slug}`,
              ]);
            } else {
              void this.router.navigate(['/login'], {
                queryParams: {
                  next: `/project/${invitation.project.slug}`,
                  projectInvitationToken: token,
                  acceptProjectInvitation: false,
                },
              });
            }
          } else {
            if (invitation.project.isAnon) {
              void this.router.navigate([
                `/project/${invitation.project.slug}`,
              ]);
              return of(true);
            } else {
              void this.router.navigate(['/signup'], {
                queryParams: {
                  project: invitation.project.name,
                  email: invitation.email,
                  acceptProjectInvitation: false,
                  projectInvitationToken: token,
                },
              });
            }
          }
          return of(true);
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
          });
          return throwError(httpResponse);
        })
      );
  }
}
