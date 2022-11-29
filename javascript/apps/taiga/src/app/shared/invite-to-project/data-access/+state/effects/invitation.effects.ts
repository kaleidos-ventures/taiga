/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { optimisticUpdate, pessimisticUpdate } from '@nrwl/angular';
import { TuiNotification } from '@taiga-ui/core';
import { InvitationApiService, ProjectApiService } from '@taiga/api';
import {
  Contact,
  ErrorManagementToastOptions,
  InvitationResponse,
} from '@taiga/data';
import { throwError } from 'rxjs';
import { catchError, debounceTime, map, switchMap, tap } from 'rxjs/operators';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import * as NewProjectActions from '~/app/modules/feature-new-project/+state/actions/new-project.actions';
import { AppService } from '~/app/services/app.service';
import { InvitationService } from '~/app/services/invitation.service';
import { RevokeInvitationService } from '~/app/services/revoke-invitation.service';
import { ButtonLoadingService } from '~/app/shared/directives/button-loading/button-loading.service';
import { filterNil } from '~/app/shared/utils/operators';
import * as InvitationActions from '../actions/invitation.action';

@Injectable()
export class InvitationEffects {
  public revokeInvitation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(InvitationActions.revokeInvitation),
      map((action) => {
        return InvitationActions.acceptInvitationIdError({
          projectId: action.projectId,
        });
      })
    );
  });

  public sendInvitations$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(NewProjectActions.inviteUsersToProject),
      pessimisticUpdate({
        run: (action) => {
          this.buttonLoadingService.start();
          return this.invitationApiService
            .inviteUsers(action.id, action.invitation)
            .pipe(
              switchMap(this.buttonLoadingService.waitLoading()),
              map((response: InvitationResponse) => {
                return InvitationActions.inviteUsersSuccess({
                  totalInvitations: action.invitation.length,
                  newInvitations: response.invitations,
                  alreadyMembers: response.alreadyMembers,
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
          let labelText;
          let messageText;
          let paramsMessage;
          let paramsLabel;
          if (action.totalInvitations && action.alreadyMembers) {
            labelText = 'invitation_success';
            messageText = 'only_members_success';
            paramsMessage = { members: action.alreadyMembers };
            paramsLabel = { invitations: action.totalInvitations };
          } else if (action.totalInvitations && !action.alreadyMembers) {
            labelText = 'invitation_ok';
            messageText = 'invitation_success';
            paramsMessage = { invitations: action.totalInvitations };
          } else if (!action.totalInvitations && action.alreadyMembers) {
            if (action.alreadyMembers === 1) {
              messageText = 'only_member_success';
            } else {
              messageText = 'only_members_success';
              paramsMessage = { members: action.alreadyMembers };
            }
          } else {
            messageText = '';
          }

          this.appService.toastNotification({
            label: labelText,
            message: messageText,
            paramsMessage,
            paramsLabel,
            status: action.totalInvitations
              ? TuiNotification.Success
              : TuiNotification.Info,
            scope: 'invitation_modal',
            autoClose: true,
          });
        })
      );
    },
    { dispatch: false }
  );

  public acceptInvitationId$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(InvitationActions.acceptInvitationId),
      optimisticUpdate({
        run: (action) => {
          return this.projectApiService.acceptInvitationId(action.id).pipe(
            concatLatestFrom(() =>
              this.store.select(selectUser).pipe(filterNil())
            ),
            map(([, user]) => {
              return InvitationActions.acceptInvitationIdSuccess({
                projectId: action.id,
                username: user.username,
              });
            })
          );
        },
        undoAction: (action, httpResponse: HttpErrorResponse) => {
          if (this.revokeInvitationService.isRevokeError(httpResponse)) {
            return this.revokeInvitationService.acceptInvitationIdRevokeError(
              action.id,
              action.name,
              action.isBanner
            );
          }
          this.appService.toastNotification({
            label: 'errors.generic_toast_label',
            message: 'errors.generic_toast_message',
            status: TuiNotification.Error,
          });

          return InvitationActions.acceptInvitationIdError({
            projectId: action.id,
          });
        },
      })
    );
  });

  public searchUser$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(InvitationActions.searchUser),
      debounceTime(200),
      concatLatestFrom(() => this.store.select(selectUser).pipe(filterNil())),
      switchMap(([action, userState]) => {
        const peopleAddedMatch = this.invitationService.matchUsersFromList(
          action.peopleAdded,
          action.searchUser.text
        );
        const peopleAddedUsernameList = action.peopleAdded.map(
          (i) => i.username
        );
        return this.invitationApiService
          .searchUser({
            text: this.invitationService.normalizeText(action.searchUser.text),
            project: action.searchUser.project,
            offset: 0,
            // to show 6 results at least and being possible to get the current user in the list we always will ask for 7 + the matched users that are on the list
            limit: peopleAddedMatch.length + 7,
          })
          .pipe(
            map((suggestedUsers: Contact[]) => {
              let suggestedList = suggestedUsers.filter(
                (suggestedUser) =>
                  suggestedUser.username !== userState.username &&
                  !peopleAddedUsernameList.includes(suggestedUser.username) &&
                  !suggestedUser.userIsMember
              );
              const alreadyMembers = suggestedUsers.filter(
                (suggestedUser) =>
                  suggestedUser.username !== userState.username &&
                  suggestedUser.userIsMember
              );
              suggestedList = [
                ...alreadyMembers,
                ...peopleAddedMatch,
                ...suggestedList,
              ].slice(0, 6);

              return InvitationActions.searchUserSuccess({
                suggestedUsers: suggestedList,
              });
            })
          );
      }),
      catchError((httpResponse: HttpErrorResponse) => {
        this.appService.errorManagement(httpResponse);
        return throwError(httpResponse);
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
    private projectApiService: ProjectApiService,
    private revokeInvitationService: RevokeInvitationService
  ) {}
}
