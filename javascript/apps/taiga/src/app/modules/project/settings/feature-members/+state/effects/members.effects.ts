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
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { optimisticUpdate, pessimisticUpdate } from '@nrwl/angular';
import { TuiNotification } from '@taiga-ui/core';
import { InvitationApiService, ProjectApiService } from '@taiga/api';
import { ErrorManagementToastOptions } from '@taiga/data';
import { EMPTY } from 'rxjs';
import {
  catchError,
  delay,
  exhaustMap,
  filter,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
import { fetchProject } from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { membersActions } from '~/app/modules/project/settings/feature-members/+state/actions/members.actions';
import {
  selectInvitationsOffset,
  selectMembersOffset,
  selectOpenRevokeInvitationDialog,
  selectUndoDoneAnimation,
} from '~/app/modules/project/settings/feature-members/+state/selectors/members.selectors';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/project/settings/feature-members/feature-members.constants';
import { initRolesPermissions } from '~/app/modules/project/settings/feature-roles-permissions/+state/actions/roles-permissions.actions';
import { AppService } from '~/app/services/app.service';
import { ButtonLoadingService } from '~/app/shared/directives/button-loading/button-loading.service';
import { filterNil } from '~/app/shared/utils/operators';

@Injectable()
export class MembersEffects {
  public nextMembersPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.setMembersPage),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      exhaustMap(([action, project]) => {
        return this.projectApiService
          .getMembers(project.slug, action.offset, MEMBERS_PAGE_SIZE)
          .pipe(
            map((membersResponse) => {
              return membersActions.fetchMembersSuccess({
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
      ofType(membersActions.setPendingPage),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      exhaustMap(([action, project]) => {
        return this.projectApiService
          .getInvitations(project.slug, action.offset, MEMBERS_PAGE_SIZE)
          .pipe(
            map((invitationsResponse) => {
              return membersActions.fetchInvitationsSuccess({
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
      ofType(membersActions.updateMembersList),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
        this.store.select(selectMembersOffset).pipe(filterNil()),
      ]),
      exhaustMap(([, project, membersOffset]) => {
        return this.projectApiService
          .getMembers(project.slug, membersOffset, MEMBERS_PAGE_SIZE)
          .pipe(
            map((membersResponse) => {
              return membersActions.fetchMembersSuccess({
                members: membersResponse.memberships,
                totalMemberships: membersResponse.totalMemberships,
                offset: membersOffset,
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
      ofType(membersActions.updateMembersList),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
        this.store.select(selectInvitationsOffset).pipe(filterNil()),
      ]),
      exhaustMap(([, project, invitationsOffset]) => {
        return this.projectApiService
          .getInvitations(project.slug, invitationsOffset, MEMBERS_PAGE_SIZE)
          .pipe(
            map((invitationsResponse) => {
              return membersActions.fetchInvitationsSuccess({
                invitations: invitationsResponse.invitations,
                totalInvitations: invitationsResponse.totalInvitations,
                offset: invitationsOffset,
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

  public revokeInvitation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.revokeInvitation),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      optimisticUpdate({
        run: (action, project) => {
          return this.projectApiService
            .revokeInvitation(project.slug, action.invitation.email)
            .pipe(map(() => membersActions.revokeInvitationSuccess()));
        },
        undoAction: () => {
          this.appService.toastNotification({
            label: 'errors.save_changes',
            message: 'errors.please_refresh',
            status: TuiNotification.Error,
          });

          return membersActions.revokeInvitationError();
        },
      })
    );
  });

  public initMembersTabPending$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.initProjectMembers),
      map(() => {
        return membersActions.setPendingPage({ offset: 0 });
      })
    );
  });

  public initMembersTabMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.initProjectMembers),
      map(() => {
        return membersActions.setMembersPage({ offset: 0 });
      })
    );
  });

  public loadRoles$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.initProjectMembers),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      map(([, project]) => {
        return initRolesPermissions({ project });
      })
    );
  });

  public resendInvitation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.resendInvitation),
      pessimisticUpdate({
        run: (action) => {
          this.buttonLoadingService.start();
          return this.invitationApiService
            .resendInvitation(action.slug, action.usernameOrEmail)
            .pipe(
              switchMap(this.buttonLoadingService.waitLoading()),
              map(() => {
                return membersActions.resendInvitationSuccess();
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.buttonLoadingService.error();
          const options: ErrorManagementToastOptions = {
            type: 'toast',
            options: {
              label: 'invitation_error',
              message: 'failed_resend_invite',
              paramsMessage: { invitations: 1 },
              status: TuiNotification.Error,
              scope: 'invitation_modal',
            },
          };
          this.appService.errorManagement(httpResponse, {
            400: options,
            404: options,
            500: options,
          });
          return membersActions.resendInvitationError();
        },
      })
    );
  });

  public resendInvitationsSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(membersActions.resendInvitationSuccess),
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

  public showUndoConfirmation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.undoCancelInvitationUi),
      delay(1000),
      concatLatestFrom(() =>
        this.store.select(selectOpenRevokeInvitationDialog)
      ),
      filter(([action, openRevokeInvitation]) => {
        return openRevokeInvitation !== action.invitation.email;
      }),
      map(([{ invitation }]) => {
        return membersActions.undoDoneAnimation({ invitation });
      })
    );
  });

  public undoDoneAnimation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.undoDoneAnimation),
      delay(3000),
      concatLatestFrom(() => this.store.select(selectUndoDoneAnimation)),
      filter(([action, undoDoneActive]) => {
        return undoDoneActive.includes(action.invitation.email);
      }),
      map(([{ invitation }]) => {
        return membersActions.removeUndoDoneAnimation({ invitation });
      })
    );
  });

  public updateMemberRole$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.updateMemberRole),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      pessimisticUpdate({
        run: (action, project) => {
          return this.projectApiService
            .updateMemberRole(project.slug, {
              username: action.username,
              roleSlug: action.roleSlug,
            })
            .pipe(
              map(() => {
                return membersActions.updateMemberRoleSuccess();
              })
            );
        },
        onError: (action) => {
          membersActions.updateMemberRoleError();
          return membersActions.resetRoleForm({
            userIdentification: action.username,
            oldRole: action.oldRole,
          });
        },
      })
    );
  });

  public updateMemberListInfo$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.updateMemberRoleSuccess),
      map(() => {
        return membersActions.updateMemberInfo();
      })
    );
  });

  public updateInvitationRole$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.updateInvitationRole),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      pessimisticUpdate({
        run: (action, project) => {
          return this.projectApiService
            .updateInvitationRole(project.slug, {
              id: action.id,
              roleSlug: action.roleSlug,
            })
            .pipe(
              map(() => {
                return membersActions.updateInvitationRoleSuccess();
              })
            );
        },
        onError: (action) => {
          membersActions.updateInvitationRoleError();
          return membersActions.resetRoleForm({
            userIdentification: action.id,
            oldRole: action.oldRole,
          });
        },
      })
    );
  });

  public updateProject$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.updateMemberInfo),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      map(([, project]) => {
        return fetchProject({ slug: project.slug });
      })
    );
  });

  public udpateMembersList$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.updateMemberInfo),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      filter(([, project]) => project.userIsAdmin),
      map(() => {
        return membersActions.updateMembersList({ eventType: 'update' });
      })
    );
  });

  constructor(
    private appService: AppService,
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private store: Store,
    private buttonLoadingService: ButtonLoadingService,
    private invitationApiService: InvitationApiService,
    private router: Router
  ) {}
}
