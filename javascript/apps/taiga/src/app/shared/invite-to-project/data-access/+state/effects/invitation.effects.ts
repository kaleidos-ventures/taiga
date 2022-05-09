/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { map, switchMap, tap } from 'rxjs/operators';

import * as InvitationActions from '../actions/invitation.action';
import * as NewProjectActions from '~/app/modules/feature-new-project/+state/actions/new-project.actions';
import { InvitationApiService } from '@taiga/api';
import { fetch, pessimisticUpdate } from '@nrwl/angular';
import { AppService } from '~/app/services/app.service';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Contact,
  ErrorManagementToastOptions,
  InvitationResponse,
} from '@taiga/data';
import { TuiNotification } from '@taiga-ui/core';
import { ButtonLoadingService } from '~/app/shared/directives/button-loading/button-loading.service';

@Injectable()
export class InvitationEffects {
  public myContacts$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(InvitationActions.fetchMyContacts),
      fetch({
        run: (action) => {
          return this.invitationApiService.myContacts(action.emails).pipe(
            map((contacts: Contact[]) => {
              return InvitationActions.fetchMyContactsSuccess({ contacts });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.errorManagement(httpResponse),
      })
    );
  });

  public sendInvitations$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(NewProjectActions.inviteUsersNewProject),
      pessimisticUpdate({
        run: (action) => {
          this.buttonLoadingService.start();

          return this.invitationApiService
            .inviteUsers(action.slug, action.invitation)
            .pipe(
              switchMap(this.buttonLoadingService.waitLoading()),
              map((response: InvitationResponse[]) => {
                return InvitationActions.inviteUsersSuccess({
                  invitations: response,
                });
              })
            );
        },
        onError: (action, httpResponse: HttpErrorResponse) => {
          this.buttonLoadingService.error();

          const options: ErrorManagementToastOptions = {
            type: 'toast',
            options: {
              label: 'invitation_error',
              message: 'failed_send_invite',
              paramsMessage: { invitations: action.invitation.length },
              status: TuiNotification.Error,
              scope: 'invitation_modal',
            },
          };
          this.appService.errorManagement(httpResponse, {
            400: options,
            500: options,
          });
          return InvitationActions.inviteUsersError();
        },
      })
    );
  });

  public sendInvitationsSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(InvitationActions.inviteUsersSuccess),
        tap((action) => {
          this.appService.toastNotification({
            label: 'invitation_ok',
            message: 'invitation_success',
            paramsMessage: { invitations: action.invitations.length },
            status: TuiNotification.Success,
            scope: 'invitation_modal',
            autoClose: true,
          });
        })
      );
    },
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private invitationApiService: InvitationApiService,
    private appService: AppService,
    private buttonLoadingService: ButtonLoadingService
  ) {}
}
