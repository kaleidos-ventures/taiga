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
import { pessimisticUpdate } from '@nrwl/angular';
import { TuiNotification } from '@taiga-ui/core';
import { InvitationApiService, ProjectApiService } from '@taiga/api';
import { ErrorManagementToastOptions } from '@taiga/data';
import { EMPTY } from 'rxjs';
import { catchError, exhaustMap, map, switchMap, tap } from 'rxjs/operators';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import {
  fetchInvitationsSuccess,
  fetchMembersSuccess,
  initMembersPage,
  setMembersPage,
  setPendingPage,
  updateMembersList
} from '~/app/modules/project/settings/feature-members/+state/actions/members.actions';
import {
  selectInvitationsOffset,
  selectMembersOffset
} from '~/app/modules/project/settings/feature-members/+state/selectors/members.selectors';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/project/settings/feature-members/feature-members.constants';
import { AppService } from '~/app/services/app.service';
import { ButtonLoadingService } from '~/app/shared/directives/button-loading/button-loading.service';
import { inviteUsersSuccess } from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { filterNil } from '~/app/shared/utils/operators';
import {
  resendInvitation,
  resendInvitationError,
  resendInvitationSuccess
} from '../actions/members.actions';

@Injectable()
export class MembersEffects {
  public nextMembersPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(setMembersPage),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),

      exhaustMap(([action, project]) => {
        return this.projectApiService
          .getMembers(project.slug, action.offset, MEMBERS_PAGE_SIZE)
          .pipe(
            map((membersResponse) => {
              return fetchMembersSuccess({
                members: membersResponse.memberships,
                totalMemberships: membersResponse.totalMemberships,
                offset: action.offset,
              });
            }),
            catchError((httpResponse: HttpErrorResponse) => {
              this.appService.errorManagement(httpResponse);
              return EMPTY;
            })
          );
      })
    );
  });

  public nextPendingPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(setPendingPage),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      exhaustMap(([action, project]) => {
        return this.projectApiService
          .getInvitations(project.slug, action.offset, MEMBERS_PAGE_SIZE)
          .pipe(
            map((invitationsResponse) => {
              return fetchInvitationsSuccess({
                invitations: invitationsResponse.invitations,
                totalInvitations: invitationsResponse.totalInvitations,
                offset: action.offset,
              });
            }),
            catchError((httpResponse: HttpErrorResponse) => {
              this.appService.errorManagement(httpResponse);
              return EMPTY;
            })
          );
      })
    );
  });

  public updateMembersList$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(updateMembersList),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
        this.store.select(selectMembersOffset).pipe(filterNil()),
      ]),
      exhaustMap(([, project, membersOffset]) => {
        return this.projectApiService
          .getMembers(project.slug, membersOffset, MEMBERS_PAGE_SIZE)
          .pipe(
            map((membersResponse) => {
              return fetchMembersSuccess({
                members: membersResponse.memberships,
                totalMemberships: membersResponse.totalMemberships,
                offset: membersOffset,
                animateList: true,
              });
            }),
            catchError((httpResponse: HttpErrorResponse) => {
              this.appService.errorManagement(httpResponse);
              return EMPTY;
            })
          );
      })
    );
  });

  public updateInvitationsList$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(updateMembersList, inviteUsersSuccess),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
        this.store.select(selectInvitationsOffset).pipe(filterNil()),
      ]),
      exhaustMap(([, project, invitationsOffset]) => {
        return this.projectApiService
          .getInvitations(project.slug, invitationsOffset, MEMBERS_PAGE_SIZE)
          .pipe(
            map((invitationsResponse) => {
              return fetchInvitationsSuccess({
                invitations: invitationsResponse.invitations,
                totalInvitations: invitationsResponse.totalInvitations,
                offset: invitationsOffset,
                animateList: true,
              });
            }),
            catchError((httpResponse: HttpErrorResponse) => {
              this.appService.errorManagement(httpResponse);
              return EMPTY;
            })
          );
      })
    );
  });

  public initMembersTabPending$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(initMembersPage),
      map(() => {
        return setPendingPage({ offset: 0 });
      })
    );
  });

  public initMembersTabMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(initMembersPage),
      map(() => {
        return setMembersPage({ offset: 0 });
      })
    );
  });

  public resendInvitation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(resendInvitation),
      pessimisticUpdate({
        run: (action) => {
          this.buttonLoadingService.start();
          return this.invitationApiService
            .resendInvitation(action.slug, action.usernameOrEmail)
            .pipe(
              switchMap(this.buttonLoadingService.waitLoading()),
              map(() => {
                return resendInvitationSuccess();
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.buttonLoadingService.error();
          const options: ErrorManagementToastOptions = {
            type: 'toast',
            options: {
              label: 'invitation_error',
              message: 'failed_send_invite',
              paramsMessage: { invitations: 1 },
              status: TuiNotification.Error,
              scope: 'invitation_modal',
            },
          };
          this.appService.errorManagement(httpResponse, {
            400: options,
            500: options,
          });
          return resendInvitationError();
        },
      })
    );
  });

  public resendInvitationsSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(resendInvitationSuccess),
        tap(() => {
          this.appService.toastNotification({
            label: 'invitation_ok',
            message: 'invitation_success',
            paramsMessage: { invitations: 1 },
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
    private appService: AppService,
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private store: Store,
    private buttonLoadingService: ButtonLoadingService,
    private invitationApiService: InvitationApiService
  ) {}
}
