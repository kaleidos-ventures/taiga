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
import {
  optimisticUpdate,
  pessimisticUpdate,
} from '@ngrx/router-store/data-persistence';
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
import {
  fetchProject,
  projectEventActions,
} from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { membersActions } from '~/app/modules/project/settings/feature-members/+state/actions/members.actions';
import {
  selectMembers,
  selectInvitations,
  selectInvitationsOffset,
  selectMembersOffset,
  selectOpenRevokeInvitationDialog,
  selectInvitationUndoDoneAnimation,
  selectMemberUndoDoneAnimation,
  selectOpenRemoveMemberDialog,
} from '~/app/modules/project/settings/feature-members/+state/selectors/members.selectors';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/project/settings/feature-members/feature-members.constants';
import { initRolesPermissions } from '~/app/modules/project/settings/feature-roles-permissions/+state/actions/roles-permissions.actions';
import { AppService } from '~/app/services/app.service';
import { ButtonLoadingService } from '~/app/shared/directives/button-loading/button-loading.service';
import { filterNil } from '~/app/shared/utils/operators';

@Injectable()
export class MembersEffects {
  public nextPendingPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.setPendingPage),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      exhaustMap(([action, project]) => {
        return this.projectApiService.getInvitations(project.id).pipe(
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
        return this.projectApiService.getMembers(project.id).pipe(
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
        return this.projectApiService.getInvitations(project.id).pipe(
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
            .revokeInvitation(project.id, action.invitation.email)
            .pipe(
              map(() =>
                membersActions.revokeInvitationSuccess({
                  invitation: action.invitation,
                })
              )
            );
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

  public revokeInvitationSuccessChangeReloadPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.revokeInvitationSuccess),
      concatLatestFrom(() => [
        this.store.select(selectInvitations).pipe(filterNil()),
        this.store.select(selectInvitationsOffset).pipe(filterNil()),
      ]),
      map(([, invitations, invitationsOffset]) => {
        const currentPageInvitations = invitations.slice(
          invitationsOffset,
          invitationsOffset + MEMBERS_PAGE_SIZE
        );

        if (currentPageInvitations.length) {
          return membersActions.setPendingPage({
            offset: invitationsOffset,
            showLoading: false,
          });
        }

        // if page is empty, go back one page
        return membersActions.setPendingPage({
          offset: invitationsOffset - MEMBERS_PAGE_SIZE,
          showLoading: false,
        });
      })
    );
  });

  public initMembersTabPending$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.initProjectMembers),
      map(() => {
        return membersActions.setPendingPage({ offset: 0, showLoading: true });
      })
    );
  });

  public initMembersTabMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.initProjectMembers),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      exhaustMap(([, project]) => {
        return this.projectApiService.getMembers(project.id).pipe(
          map((membersResponse) => {
            return membersActions.fetchMembersSuccess({
              members: membersResponse.memberships,
              totalMemberships: membersResponse.totalMemberships,
              offset: 0,
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
            .resendInvitation(action.id, action.usernameOrEmail)
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
      ofType(membersActions.undoCancelInvitationUI),
      delay(1000),
      concatLatestFrom(() =>
        this.store.select(selectOpenRevokeInvitationDialog)
      ),
      filter(([action, openRevokeInvitation]) => {
        return openRevokeInvitation !== action.invitation.email;
      }),
      map(([{ invitation }]) => {
        return membersActions.invitationUndoDoneAnimation({ invitation });
      })
    );
  });

  public undoDoneAnimation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.invitationUndoDoneAnimation),
      delay(3000),
      concatLatestFrom(() =>
        this.store.select(selectInvitationUndoDoneAnimation)
      ),
      filter(([action, undoDoneActive]) => {
        return undoDoneActive.includes(action.invitation.email);
      }),
      map(([{ invitation }]) => {
        return membersActions.removeInvitationUndoDoneAnimation({ invitation });
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
            .updateMemberRole(project.id, {
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
            .updateInvitationRole(project.id, {
              id: action.id,
              roleSlug: action.newRole.slug!,
            })
            .pipe(
              map(() => {
                return membersActions.updateInvitationRoleSuccess({
                  id: action.id,
                  newRole: action.newRole,
                });
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
        return fetchProject({ id: project.id });
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

  public removeMember$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.removeMember),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      exhaustMap(([action, project]) => {
        return this.projectApiService
          .removeMember(project.id, action.username)
          .pipe(
            map(() => {
              return projectEventActions.userLostProjectMembership({
                username: action.username,
                projectName: project.name,
                isSelf: action.isSelf,
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

  public removeMemberSuccessChangeReloadPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(projectEventActions.userLostProjectMembership),
      concatLatestFrom(() => [
        this.store.select(selectMembers).pipe(filterNil()),
        this.store.select(selectMembersOffset).pipe(filterNil()),
      ]),
      map(([, members, membersOffset]) => {
        const currentPageMembers = members.slice(
          membersOffset,
          membersOffset + MEMBERS_PAGE_SIZE
        );

        if (currentPageMembers.length) {
          return membersActions.setMembersPage({
            offset: membersOffset,
            showLoading: false,
          });
        }

        // if page is empty, go back one page
        return membersActions.setMembersPage({
          offset: membersOffset - MEMBERS_PAGE_SIZE,
          showLoading: false,
        });
      })
    );
  });

  public showRemoveMemberUndoConfirmation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.undoCancelRemoveMemberUI),
      delay(1000),
      concatLatestFrom(() => this.store.select(selectOpenRemoveMemberDialog)),
      filter(([action, openRemoveMember]) => {
        return openRemoveMember !== action.member.user.username;
      }),
      map(([{ member }]) => {
        return membersActions.removeMemberUndoDoneAnimation({ member });
      })
    );
  });

  public undoRemoveMemberDoneAnimation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(membersActions.removeMemberUndoDoneAnimation),
      delay(3000),
      concatLatestFrom(() => this.store.select(selectMemberUndoDoneAnimation)),
      filter(([action, undoDoneActive]) => {
        return undoDoneActive.includes(action.member.user.username);
      }),
      map(([{ member }]) => {
        return membersActions.deleteRemoveMemberUndoDoneAnimation({ member });
      })
    );
  });

  constructor(
    private appService: AppService,
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private store: Store,
    private buttonLoadingService: ButtonLoadingService,
    private invitationApiService: InvitationApiService
  ) {}
}
