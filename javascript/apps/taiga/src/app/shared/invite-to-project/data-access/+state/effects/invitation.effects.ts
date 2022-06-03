/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, tap } from 'rxjs/operators';
import * as InvitationActions from '../actions/invitation.action';
import * as NewProjectActions from '~/app/modules/feature-new-project/+state/actions/new-project.actions';
import { InvitationApiService } from '@taiga/api';
import { fetch, optimisticUpdate, pessimisticUpdate } from '@nrwl/angular';
import { AppService } from '~/app/services/app.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Contact, ErrorManagementToastOptions, Invitation } from '@taiga/data';
import { TuiNotification } from '@taiga-ui/core';
import { ButtonLoadingService } from '~/app/shared/directives/button-loading/button-loading.service';
import { InvitationService } from '~/app/services/invitation.service';
import { selectInvitations } from '~/app/modules/project/feature-overview/data-access/+state/selectors/project-overview.selectors';
import { ProjectApiService } from '@taiga/api';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { Store } from '@ngrx/store';
import { filterNil } from '~/app/shared/utils/operators';

@Injectable()
export class InvitationEffects {
  public sendInvitations$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(NewProjectActions.inviteUsersToProject),
      concatLatestFrom(() =>
        this.store.select(selectInvitations).pipe(filterNil())
      ),
      pessimisticUpdate({
        run: (action, invitationsState) => {
          this.buttonLoadingService.start();
          return this.invitationApiService
            .inviteUsers(action.slug, action.invitation)
            .pipe(
              switchMap(this.buttonLoadingService.waitLoading()),
              map((response: Invitation[]) => {
                const invitationsOrdered: Invitation[] =
                  invitationsState.slice();
                response.forEach((inv) => {
                  const isAlreadyInTheList = invitationsState.find((it) => {
                    return inv.email
                      ? it.email === inv.email
                      : it.user?.username === inv.user?.username;
                  });
                  if (!isAlreadyInTheList) {
                    invitationsOrdered.splice(
                      this.invitationService.positionInvitationInArray(
                        invitationsOrdered,
                        inv
                      ),
                      0,
                      inv
                    );
                  }
                });
                return InvitationActions.inviteUsersSuccess({
                  newInvitations: response,
                  allInvitationsOrdered: invitationsOrdered,
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
            paramsMessage: { invitations: action.newInvitations.length },
            status: TuiNotification.Success,
            scope: 'invitation_modal',
            autoClose: true,
          });
        })
      );
    },
    { dispatch: false }
  );

  public acceptInvitationSlug$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(InvitationActions.acceptInvitationSlug),
      optimisticUpdate({
        run: (action) => {
          return this.projectApiService.acceptInvitationSlug(action.slug).pipe(
            concatLatestFrom(() =>
              this.store.select(selectUser).pipe(filterNil())
            ),
            map(([, user]) => {
              return InvitationActions.acceptInvitationSlugSuccess({
                projectSlug: action.slug,
                username: user.username,
              });
            })
          );
        },
        undoAction: (action) => {
          this.appService.toastNotification({
            label: 'errors.generic_toast_label',
            message: 'errors.generic_toast_message',
            status: TuiNotification.Error,
          });

          return InvitationActions.acceptInvitationSlugError({
            projectSlug: action.slug,
          });
        },
      })
    );
  });

  public searchUser$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(InvitationActions.searchUser),
      fetch({
        run: (action) => {
          return this.invitationApiService.searchUser(action.searchUser).pipe(
            map((suggestedUsers: Contact[]) => {
              return InvitationActions.searchUserSuccess({ suggestedUsers });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.errorManagement(httpResponse),
      })
    );
  });

  constructor(
    private store: Store,
    private actions$: Actions,
    private invitationApiService: InvitationApiService,
    private invitationService: InvitationService,
    private appService: AppService,
    private buttonLoadingService: ButtonLoadingService,
    private projectApiService: ProjectApiService
  ) {}
}
