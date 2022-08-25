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
import { genericResponseError, InvitationInfo } from '@taiga/data';
import { EMPTY } from 'rxjs';
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
    private router: Router
  ) {}

  public invitationCtaRevokeError(
    invitation: InvitationInfo,
    httpResponse: HttpErrorResponse
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
      if (invitation.project.isAnon) {
        void this.router.navigate([`/project/${invitation.project.slug}`]);
      } else {
        void this.router.navigate(['/']);
      }
    }
  }

  public acceptInvitationTokenRevokeError(
    httpResponse: HttpErrorResponse,
    next: string,
    isNextAnonProject?: boolean
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
      if (isNextAnonProject) {
        void this.router.navigateByUrl(next);
      } else {
        void this.router.navigate(['/']);
      }
      return EMPTY;
    }
    return null;
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
      message: 'errors.no_permission_to_see',
      status: TuiNotification.Error,
      autoClose: false,
      closeOnNavigation: false,
    });
    void this.router.navigate(['/signup']);
  }

  public acceptInvitationSlugRevokeError(slug: string, name?: string) {
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
