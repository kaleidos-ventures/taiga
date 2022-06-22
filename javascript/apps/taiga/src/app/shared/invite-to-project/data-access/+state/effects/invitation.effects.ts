/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { catchError, debounceTime, map, switchMap, tap } from 'rxjs/operators';
import * as InvitationActions from '../actions/invitation.action';
import * as NewProjectActions from '~/app/modules/feature-new-project/+state/actions/new-project.actions';
import { InvitationApiService } from '@taiga/api';
import { optimisticUpdate, pessimisticUpdate } from '@nrwl/angular';
import { AppService } from '~/app/services/app.service';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Contact,
  ErrorManagementToastOptions,
  Invitation,
  InvitationResponse,
} from '@taiga/data';
import { TuiNotification } from '@taiga-ui/core';
import { ButtonLoadingService } from '~/app/shared/directives/button-loading/button-loading.service';
import { InvitationService } from '~/app/services/invitation.service';
import {
  selectInvitations,
  selectMembers,
} from '~/app/modules/project/feature-overview/data-access/+state/selectors/project-overview.selectors';
import { ProjectApiService } from '@taiga/api';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { Store } from '@ngrx/store';
import { filterNil } from '~/app/shared/utils/operators';
import { throwError } from 'rxjs';

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
              map((response: InvitationResponse) => {
                const invitationsOrdered: Invitation[] =
                  invitationsState.slice();
                response.invitations.forEach((inv) => {
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
                  newInvitations: response.invitations,
                  allInvitationsOrdered: invitationsOrdered,
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
          // TODO remove this timeout when the issue #2478 is resolved
          setTimeout(() => {
            let labelText;
            let messageText;
            let paramsMessage;
            let paramsLabel;
            if (action.newInvitations.length && action.alreadyMembers) {
              labelText = 'invitation_success';
              messageText = 'only_members_success';
              paramsMessage = { members: action.alreadyMembers };
              paramsLabel = { invitations: action.newInvitations.length };
            } else if (action.newInvitations.length && !action.alreadyMembers) {
              labelText = 'invitation_ok';
              messageText = 'invitation_success';
              paramsMessage = { invitations: action.newInvitations.length };
            } else if (!action.newInvitations.length && action.alreadyMembers) {
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
              status: action.newInvitations.length
                ? TuiNotification.Success
                : TuiNotification.Info,
              scope: 'invitation_modal',
              autoClose: true,
            });
          }, 100);
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
      debounceTime(200),
      concatLatestFrom(() => [
        this.store.select(selectMembers).pipe(filterNil()),
        this.store.select(selectUser).pipe(filterNil()),
      ]),
      switchMap(([action, membersState, userState]) => {
        const membersUsername = membersState.map((it) => it.user.username);
        const addedUsersUsername = action.peopleAdded.map((j) => j.username);
        return this.invitationApiService
          .searchUser({
            text: this.invitationService.normalizeText(action.searchUser.text),
            project: action.searchUser.project,
            excludedUsers: [
              userState.username,
              ...membersUsername,
              ...addedUsersUsername,
            ],
            offset: 0,
            limit: 6,
          })
          .pipe(
            map((suggestedUsers: Contact[]) => {
              const membersListParsed: Contact[] = membersState
                .map((member) => {
                  return {
                    username: member.user.username,
                    fullName: member.user.fullName,
                    isMember: true,
                  };
                })
                .filter((it) => it.username !== userState.username);
              const membersMatch = this.invitationService.matchUsersFromList(
                membersListParsed,
                action.searchUser.text
              );
              const peopleAddedMatch =
                this.invitationService.matchUsersFromList(
                  action.peopleAdded,
                  action.searchUser.text
                );
              let suggestedList = suggestedUsers;
              if (membersMatch) {
                suggestedList = [
                  ...membersMatch,
                  ...peopleAddedMatch,
                  ...suggestedList,
                ].slice(0, 6);
              }
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
    private projectApiService: ProjectApiService
  ) {}
}
