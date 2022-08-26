/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService } from '@taiga/api';
import { genericResponseError, InvitationInfo } from '@taiga/data';
import { catchError, EMPTY, map, of } from 'rxjs';
import * as InvitationActions from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { revokedError } from '../modules/errors/+state/actions/errors.actions';
import { AppService } from './app.service';
@Injectable({
  providedIn: 'root',
})
export class RevokeInvitationService {
  constructor(
    private store: Store,
    private appService: AppService,
    private router: Router,
    private projectApiService: ProjectApiService
  ) {}

  public invitationCtaRevokeError(
    invitation: InvitationInfo,
    httpResponse: HttpErrorResponse
  ) {
    return this.projectApiService.getProject(invitation.project.slug).pipe(
      catchError(() => {
        return of(null);
      }),
      map((project) => {
        if (this.isRevokeError(httpResponse)) {
          this.appService.toastNotification({
            message: 'errors.invitation_no_longer_valid',
            status: TuiNotification.Error,
            autoClose: false,
            closeOnNavigation: false,
          });

          this.store.dispatch(
            revokedError({
              error: {
                message: httpResponse.message,
              },
            })
          );

          if (project && project.userPermissions.length > 0) {
            return this.router.parseUrl(`/project/${invitation.project.slug}`);
          }
        }

        return this.router.parseUrl('/');
      })
    );
  }

  public acceptInvitationTokenRevokeError(
    httpResponse: HttpErrorResponse,
    next: string,
    nextHasPermission?: boolean
  ) {
    if (this.isRevokeError(httpResponse)) {
      this.store.dispatch(
        revokedError({
          error: {
            message: httpResponse.message,
          },
        })
      );
      this.appService.toastNotification({
        message: 'errors.invitation_no_longer_valid',
        status: TuiNotification.Error,
        autoClose: false,
        closeOnNavigation: false,
      });
      if (nextHasPermission) {
        void this.router.navigateByUrl(next);
      } else {
        void this.router.navigate(['/']);
      }
      return EMPTY;
    }
    return null;
  }

  public wsRevokedInvitationError() {
    this.appService.toastNotification({
      message: 'errors.invitation_no_longer_valid',
      status: TuiNotification.Error,
      autoClose: false,
      closeOnNavigation: false,
    });
    void this.router.navigate(['/']);
  }

  public shellResolverRevokeError(httpResponse: HttpErrorResponse) {
    requestAnimationFrame(() => {
      const status = window.history.state as { invite: string } | undefined;
      if (status?.invite === 'revoked') {
        this.store.dispatch(
          revokedError({
            error: {
              message: httpResponse.message,
            },
          })
        );
        this.appService.toastNotification({
          message: 'errors.you_dont_have_permission_to_see',
          status: TuiNotification.Error,
          autoClose: false,
          closeOnNavigation: false,
        });

        void this.router.navigate(['/']);
      } else {
        this.appService.errorManagement(httpResponse);
      }
    });
  }

  public verifyEmailRevokeError(httpResponse: HttpErrorResponse) {
    this.store.dispatch(
      revokedError({
        error: {
          message: httpResponse.message,
        },
      })
    );
    this.appService.toastNotification({
      message: 'errors.you_dont_have_permission_to_see',
      status: TuiNotification.Error,
      autoClose: false,
      closeOnNavigation: false,
    });
    void this.router.navigate(['/signup']);
  }

  public acceptInvitationSlugRevokeError(
    slug: string,
    name?: string,
    isBanner?: boolean
  ) {
    let param;
    let message;
    if (name) {
      message = 'errors.project_invitation_no_longer_valid';
      param = {
        name: name,
      };
    } else {
      message = 'errors.invitation_no_longer_valid';
      param = {};
    }
    this.appService.toastNotification({
      message: message,
      paramsMessage: param,
      status: TuiNotification.Error,
      autoClose: false,
      closeOnNavigation: false,
    });
    if (isBanner) {
      return InvitationActions.revokeInvitationBannerSlugError({
        projectSlug: slug,
      });
    }
    return InvitationActions.revokeInvitation({
      projectSlug: slug,
    });
  }

  public isRevokeError(httpResponse: HttpErrorResponse) {
    if (
      httpResponse.status === 400 &&
      (httpResponse.error as genericResponseError).error.detail ===
        'invitation-revoked-error'
    ) {
      return true;
    }
    return false;
  }
}
