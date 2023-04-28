/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
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
  InvitationWorkspaceMember,
} from '@taiga/data';
import { throwError } from 'rxjs';
import { catchError, debounceTime, map, switchMap, tap } from 'rxjs/operators';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { AppService } from '~/app/services/app.service';
import { InvitationService } from '~/app/services/invitation.service';
import { getSuggestedInvitationsList } from './invitation.effects.helpers';
import { RevokeInvitationService } from '~/app/services/revoke-invitation.service';
import { ButtonLoadingService } from '~/app/shared/directives/button-loading/button-loading.service';
import { filterNil } from '~/app/shared/utils/operators';
import { UtilsService } from '~/app/shared/utils/utils-service.service';
import {
  revokeInvitation,
  invitationProjectActions,
  invitationWorkspaceActions,
} from '../actions/invitation.action';

@Injectable()
export class InvitationEffects {
  public revokeInvitation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(revokeInvitation),
      map((action) => {
        return invitationProjectActions.acceptInvitationIdError({
          projectId: action.projectId,
        });
      })
    );
  });

  public sendProjectInvitations$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(invitationProjectActions.inviteUsers),
      pessimisticUpdate({
        run: (action) => {
          this.buttonLoadingService.start();
          return this.invitationApiService
            .inviteUsers(action.id, action.invitation)
            .pipe(
              switchMap(this.buttonLoadingService.waitLoading()),
              map((response: InvitationResponse) => {
                return invitationProjectActions.inviteUsersSuccess({
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
          return invitationProjectActions.inviteUsersError();
        },
      })
    );
  });

  public sendInvitationsSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(
          invitationProjectActions.inviteUsersSuccess,
          invitationWorkspaceActions.inviteUsersSuccess
        ),
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
      ofType(invitationProjectActions.acceptInvitationId),
      optimisticUpdate({
        run: (action) => {
          return this.projectApiService.acceptInvitationId(action.id).pipe(
            concatLatestFrom(() =>
              this.store.select(selectUser).pipe(filterNil())
            ),
            map(([, user]) => {
              return invitationProjectActions.acceptInvitationIdSuccess({
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

          return invitationProjectActions.acceptInvitationIdError({
            projectId: action.id,
          });
        },
      })
    );
  });

  public sendWorkspaceInvitations$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(invitationWorkspaceActions.inviteUsers),
      pessimisticUpdate({
        run: (action) => {
          this.buttonLoadingService.start();
          return this.invitationApiService
            .inviteWorkspaceUsers(action.id, action.invitation)
            .pipe(
              switchMap(this.buttonLoadingService.waitLoading()),
              map((response: InvitationResponse) => {
                const invitations = response.invitations.map((it) => {
                  return {
                    workspace: { id: action.id },
                    ...it,
                  } as InvitationWorkspaceMember;
                });
                return invitationWorkspaceActions.inviteUsersSuccess({
                  totalInvitations: action.invitation.length,
                  newInvitations: invitations,
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
          return invitationWorkspaceActions.inviteUsersError();
        },
      })
    );
  });

  public projectSearchUser$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(invitationProjectActions.searchUsers),
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
            text: UtilsService.normalizeText(action.searchUser.text),
            project: action.searchUser.project,
            offset: 0,
            // to show 6 results at least and being possible to get the current user in the list we always will ask for 7 + the matched users that are on the list
            limit: peopleAddedMatch.length + 7,
          })
          .pipe(
            map((suggestedUsers: Contact[]) => {
              return invitationProjectActions.searchUsersSuccess({
                suggestedUsers: getSuggestedInvitationsList(
                  suggestedUsers,
                  peopleAddedMatch,
                  peopleAddedUsernameList,
                  userState
                ),
              });
            })
          );
      }),
      catchError((httpResponse: HttpErrorResponse) => {
        this.appService.errorManagement(httpResponse);
        return throwError(() => httpResponse);
      })
    );
  });

  public workspaceSearchUser$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(invitationWorkspaceActions.searchUsers),
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
            text: UtilsService.normalizeText(action.searchUser.text),
            workspace: action.searchUser.workspace,
            offset: 0,
            // to show 6 results at least and being possible to get the current user in the list we always will ask for 7 + the matched users that are on the list
            limit: peopleAddedMatch.length + 7,
          })
          .pipe(
            map((suggestedUsers: Contact[]) => {
              return invitationWorkspaceActions.searchUsersSuccess({
                suggestedUsers: getSuggestedInvitationsList(
                  suggestedUsers,
                  peopleAddedMatch,
                  peopleAddedUsernameList,
                  userState
                ),
              });
            })
          );
      }),
      catchError((httpResponse: HttpErrorResponse) => {
        this.appService.errorManagement(httpResponse);
        return throwError(() => httpResponse);
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
