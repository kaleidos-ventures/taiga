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
import { Store } from '@ngrx/store';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService, UsersApiService } from '@taiga/api';
import { ConfigService } from '@taiga/core';
import { Auth, InvitationInfo, User } from '@taiga/data';
import { forkJoin, throwError } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { AppService } from '~/app/services/app.service';
import { RevokeInvitationService } from '~/app/services/revoke-invitation.service';
import { loginSuccess } from '../data-access/+state/actions/auth.actions';
import { AuthService } from '../services/auth.service';
type InvitationVerification = Pick<InvitationInfo, 'project' | 'status'>;
type VerificationData = {
  auth: Auth;
  projectInvitation: InvitationVerification;
};

@Injectable({
  providedIn: 'root',
})
export class VerifyEmailGuard implements CanActivate {
  constructor(
    private http: HttpClient,
    private config: ConfigService,
    private appService: AppService,
    private router: Router,
    private store: Store,
    private authService: AuthService,
    private usersApiService: UsersApiService,
    private projectApiService: ProjectApiService,
    private revokeInvitationService: RevokeInvitationService
  ) {}
  public canActivate(route: ActivatedRouteSnapshot) {
    const verifyParam = route.params.path as string;
    return this.http
      .post<{
        auth: Auth;
        projectInvitation: InvitationVerification;
      }>(`${this.config.apiUrl}/users/verify`, {
        token: verifyParam,
      })
      .pipe(
        mergeMap((verification: VerificationData) => {
          this.authService.setAuth(verification.auth);
          return forkJoin(
            this.usersApiService.me().pipe(
              map((user: User) => {
                this.authService.setUser(user);
                return { user, verification };
              })
            ),
            this.projectApiService
              .getProject(verification.projectInvitation?.project?.slug)
              .pipe(
                catchError((httpResponse: HttpErrorResponse) => {
                  this.revokeInvitationService.verifyEmailRevokeError(
                    httpResponse
                  );
                  return throwError(() => httpResponse);
                })
              )
          );
        }),
        map(([{ user, verification }]) => {
          const slug = verification.projectInvitation?.project?.slug;
          const data = {
            user,
            auth: verification.auth,
            next: slug ? `/project/${slug}` : undefined,
          };

          this.store.dispatch(loginSuccess(data));
          return true;
        }),
        catchError((httpResponse: HttpErrorResponse) => {
          if (httpResponse.status === 404) {
            this.appService.errorManagement(httpResponse, {
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
            void this.router.navigate(['/signup']);
          } else if (httpResponse.status === 400) {
            void this.router.navigate(['/login']);
          }
          return throwError(() => new Error('Invalid token'));
        })
      );
  }
}
