/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import {
  fetch,
  optimisticUpdate,
  pessimisticUpdate,
} from '@ngrx/router-store/data-persistence';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService, WorkspaceApiService } from '@taiga/api';
import { EMPTY, timer, zip } from 'rxjs';
import { catchError, exhaustMap, map, tap } from 'rxjs/operators';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/workspace/feature-detail/workspace-feature.constants';
import { AppService } from '~/app/services/app.service';
import {
  workspaceActions,
  workspaceDetailActions,
  workspaceDetailApiActions,
  workspaceDetailEventActions,
} from '../actions/workspace-detail.actions';
import {
  selectMembersList,
  selectMembersOffset,
  selectInvitationsOffset,
  selectNonMembersOffset,
} from '../selectors/workspace-detail.selectors';
import { Store } from '@ngrx/store';
import { filterNil } from '~/app/shared/utils/operators';

@Injectable()
export class WorkspaceDetailEffects {
  public loadWorkspace$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceActions.fetchWorkspace),
      fetch({
        run: (action) => {
          return this.workspaceApiService.fetchWorkspaceDetail(action.id).pipe(
            map((workspace) => {
              return workspaceActions.fetchWorkspaceSuccess({
                workspace,
              });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.errorManagement(httpResponse),
      })
    );
  });

  public loadWorkspaceProjects$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceActions.fetchWorkspace),
      fetch({
        run: (action) => {
          return zip(
            this.workspaceApiService.fetchWorkspaceProjects(action.id),
            this.workspaceApiService.fetchWorkspaceInvitedProjects(action.id),
            timer(1000)
          ).pipe(
            map(([projects, invitedProjects]) => {
              return workspaceActions.fetchWorkspaceProjectSuccess({
                projects,
                invitedProjects,
              });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.errorManagement(httpResponse),
      })
    );
  });

  public invitationDetailCreateEvent$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceActions.invitationDetailCreateEvent),
      pessimisticUpdate({
        run: (action) => {
          return zip(
            this.workspaceApiService.fetchWorkspaceProjects(action.workspaceId),
            this.workspaceApiService.fetchWorkspaceInvitedProjects(
              action.workspaceId
            ),
            timer(300)
          ).pipe(
            map(([project, invitations]) => {
              return workspaceDetailActions.fetchInvitationsSuccess({
                projectId: action.projectId,
                project,
                invitations,
                role: action.role,
              });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.errorManagement(httpResponse),
      })
    );
  });

  public projectDeleted$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceDetailEventActions.projectDeleted),
      pessimisticUpdate({
        run: (action) => {
          return zip(
            this.workspaceApiService.fetchWorkspace(action.workspaceId),
            timer(300)
          ).pipe(
            map(([workspace]) => {
              return workspaceActions.fetchWorkspaceSuccess({
                workspace: workspace,
              });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.errorManagement(httpResponse),
      })
    );
  });

  public updateWorkspace$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceActions.updateWorkspace),
      optimisticUpdate({
        run: ({ currentWorkspace, nextWorkspace }) => {
          return this.workspaceApiService
            .updateWorkspace(currentWorkspace.id, nextWorkspace)
            .pipe(
              map((workspace) => {
                return workspaceActions.updateWorkspaceSuccess({
                  workspace,
                });
              })
            );
        },
        undoAction: ({ currentWorkspace }) => {
          return workspaceActions.updateWorkspaceError({
            workspace: currentWorkspace,
          });
        },
      })
    );
  });

  public updateWorkspaceSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(workspaceActions.updateWorkspaceSuccess),
        tap(() => {
          this.appService.toastNotification({
            message: 'edit.changes_saved',
            status: TuiNotification.Success,
            scope: 'workspace',
            autoClose: true,
            closeOnNavigation: false,
          });
        })
      );
    },
    { dispatch: false }
  );

  public deleteWorkspace$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceActions.deleteWorkspace),
      pessimisticUpdate({
        run: (action) => {
          return this.workspaceApiService.deleteWorkspace(action.id).pipe(
            map(() => {
              return workspaceActions.deleteWorkspaceSuccess({
                id: action.id,
                name: action.name,
              });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.appService.errorManagement(httpResponse, {
            any: {
              type: 'toast',
              options: {
                label: 'errors.generic_toast_label',
                message: 'errors.generic_toast_message',
                status: TuiNotification.Error,
              },
            },
          });
          void this.router.navigate(['/']);
        },
      })
    );
  });

  public deleteWorkspaceSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(workspaceActions.deleteWorkspaceSuccess),
        tap((action) => {
          this.appService.toastNotification({
            message: 'delete.deleted_worspace',
            paramsMessage: { name: action.name },
            status: TuiNotification.Info,
            scope: 'workspace',
            autoClose: true,
            closeOnNavigation: false,
          });
          void this.router.navigate(['/']);
        })
      );
    },
    { dispatch: false }
  );

  public workspaceDeleted$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(workspaceDetailEventActions.workspaceDeleted),
        tap((action) => {
          this.appService.toastNotification({
            message: 'delete.deleted_worspace',
            paramsMessage: { name: action.name },
            status: TuiNotification.Error,
            scope: 'workspace',
            closeOnNavigation: false,
          });
          void this.router.navigate(['/']);
        })
      );
    },
    { dispatch: false }
  );

  public deleteWorkspaceProject$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceActions.deleteWorkspaceProject),
      pessimisticUpdate({
        run: (action) => {
          return this.projectApiService.deleteProject(action.projectId).pipe(
            map(() => {
              return workspaceActions.deleteWorkspaceProjectSuccess({
                projectId: action.projectId,
                projectName: action.projectName,
              });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.appService.errorManagement(httpResponse, {
            any: {
              type: 'toast',
              options: {
                label: 'errors.generic_toast_label',
                message: 'errors.generic_toast_message',
                status: TuiNotification.Error,
              },
            },
          });
        },
      })
    );
  });

  public deleteWorkspaceProjectSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(workspaceActions.deleteWorkspaceProjectSuccess),
        tap((action) => {
          void this.appService.toastNotification({
            message: 'errors.deleted_project',
            paramsMessage: { name: action.projectName },
            status: TuiNotification.Info,
          });
        })
      );
    },
    { dispatch: false }
  );

  public initWorkspacePeople$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceDetailApiActions.initWorkspacePeople),
      exhaustMap((action) => {
        return zip(
          this.workspaceApiService.getWorkspaceMembers(
            action.id,
            0,
            MEMBERS_PAGE_SIZE
          ),
          this.workspaceApiService.getWorkspaceNonMembers(
            action.id,
            0,
            MEMBERS_PAGE_SIZE
          ),
          this.workspaceApiService.getWorkspaceInvitationMembers(
            action.id,
            0,
            MEMBERS_PAGE_SIZE
          )
        ).pipe(
          map((response) => {
            return workspaceDetailApiActions.initWorkspacePeopleSuccess({
              members: {
                members: response[0].members,
                totalMembers: response[0].totalMembers,
                offset: 0,
              },
              nonMembers: {
                members: response[1].members,
                totalMembers: response[1].totalMembers,
                offset: 0,
              },
              invitations: {
                members: response[2].members,
                totalMembers: response[2].totalMembers,
                offset: 0,
              },
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

  public loadWorkspaceMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceDetailApiActions.getWorkspaceMembers),
      exhaustMap((action) => {
        return this.workspaceApiService
          .getWorkspaceMembers(action.id, action.offset, MEMBERS_PAGE_SIZE)
          .pipe(
            map((membersResponse) => {
              return workspaceDetailApiActions.getWorkspaceMembersSuccess({
                members: membersResponse.members,
                totalMembers: membersResponse.totalMembers,
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

  public loadWorkspaceNonMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceDetailApiActions.getWorkspaceNonMembers),
      exhaustMap((action) => {
        return this.workspaceApiService
          .getWorkspaceNonMembers(action.id, action.offset, MEMBERS_PAGE_SIZE)
          .pipe(
            map((membersResponse) => {
              return workspaceDetailApiActions.getWorkspaceNonMembersSuccess({
                members: membersResponse.members,
                totalMembers: membersResponse.totalMembers,
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

  public removeMember$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceDetailApiActions.removeMember),
      pessimisticUpdate({
        run: (action) => {
          return this.workspaceApiService
            .removeWorkspaceMember(action.id, action.member)
            .pipe(
              map(() => {
                return workspaceDetailApiActions.removeMemberSuccess({
                  id: action.id,
                  member: action.member,
                });
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.appService.errorManagement(httpResponse, {
            any: {
              type: 'toast',
              options: {
                label: 'errors.generic_toast_label',
                message: 'errors.generic_toast_message',
                status: TuiNotification.Error,
              },
            },
          });
        },
      })
    );
  });

  public removeMemberSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        workspaceDetailApiActions.removeMemberSuccess,
        workspaceDetailEventActions.removeMember
      ),
      map((action) => {
        return workspaceDetailApiActions.getWorkspaceNonMembers({
          id: action.id,
          offset: 0,
        });
      })
    );
  });

  public removeMemberSuccessChangeReloadPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        workspaceDetailApiActions.removeMemberSuccess,
        workspaceDetailEventActions.removeMember
      ),
      concatLatestFrom(() => [
        this.store.select(selectMembersList),
        this.store.select(selectMembersOffset),
      ]),
      map(([action, members, offset]) => {
        if (members.length) {
          return workspaceDetailApiActions.getWorkspaceMembers({
            id: action.id,
            offset,
            showLoading: false,
          });
        }

        // if page is empty, go back one page
        return workspaceDetailApiActions.getWorkspaceMembers({
          id: action.id,
          offset: offset - MEMBERS_PAGE_SIZE,
          showLoading: false,
        });
      })
    );
  });

  public loadWorkspaceMemberInvitations$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceDetailApiActions.getWorkspaceMemberInvitations),
      exhaustMap((action) => {
        return this.workspaceApiService
          .getWorkspaceInvitationMembers(
            action.id,
            action.offset,
            MEMBERS_PAGE_SIZE
          )
          .pipe(
            map((membersResponse) => {
              return workspaceDetailApiActions.getWorkspaceMemberInvitationsSuccess(
                {
                  members: membersResponse.members,
                  totalMembers: membersResponse.totalMembers,
                  offset: action.offset,
                }
              );
            }),
            catchError((httpResponse: HttpErrorResponse) => {
              this.appService.errorManagement(httpResponse);
              return EMPTY;
            })
          );
      })
    );
  });

  public updateWorkspaceMembersInvitations$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceDetailEventActions.updateMembersInvitationsList),
      concatLatestFrom(() => [
        this.store.select(selectInvitationsOffset).pipe(filterNil()),
        this.store.select(selectMembersOffset).pipe(filterNil()),
      ]),
      exhaustMap(([action, invitationsOffset, membersOffset]) => {
        return zip(
          this.workspaceApiService.getWorkspaceMembers(
            action.id,
            membersOffset,
            MEMBERS_PAGE_SIZE
          ),
          this.workspaceApiService.getWorkspaceInvitationMembers(
            action.id,
            invitationsOffset,
            MEMBERS_PAGE_SIZE
          )
        ).pipe(
          map((response) => {
            return workspaceDetailEventActions.updateMembersInvitationsListSuccess(
              {
                members: {
                  members: response[0].members,
                  totalMembers: response[0].totalMembers,
                  offset: membersOffset,
                },
                invitations: {
                  members: response[1].members,
                  totalMembers: response[1].totalMembers,
                  offset: invitationsOffset,
                },
              }
            );
          }),
          catchError((httpResponse: HttpErrorResponse) => {
            this.appService.errorManagement(httpResponse);
            return EMPTY;
          })
        );
      })
    );
  });

  public updateWorkspaceInvitationsAndNonMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceDetailEventActions.updateNonMembersInvitationsList),
      concatLatestFrom(() => [
        this.store.select(selectInvitationsOffset).pipe(filterNil()),
        this.store.select(selectNonMembersOffset).pipe(filterNil()),
      ]),
      exhaustMap(([action, invitationsOffset, nonMembersOffset]) => {
        return zip(
          this.workspaceApiService.getWorkspaceNonMembers(
            action.id,
            nonMembersOffset,
            MEMBERS_PAGE_SIZE
          ),
          this.workspaceApiService.getWorkspaceInvitationMembers(
            action.id,
            invitationsOffset,
            MEMBERS_PAGE_SIZE
          )
        ).pipe(
          map((response) => {
            return workspaceDetailEventActions.updateNonMembersInvitationsListSuccess(
              {
                nonMembers: {
                  members: response[0].members,
                  totalMembers: response[0].totalMembers,
                  offset: nonMembersOffset,
                },
                invitations: {
                  members: response[1].members,
                  totalMembers: response[1].totalMembers,
                  offset: invitationsOffset,
                },
              }
            );
          }),
          catchError((httpResponse: HttpErrorResponse) => {
            this.appService.errorManagement(httpResponse);
            return EMPTY;
          })
        );
      })
    );
  });

  public updateInvitationsMembersList$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceDetailEventActions.updateInvitationsList),
      concatLatestFrom(() =>
        this.store.select(selectInvitationsOffset).pipe(filterNil())
      ),
      exhaustMap(([action, invitationsOffset]) => {
        return this.workspaceApiService
          .getWorkspaceInvitationMembers(
            action.id,
            invitationsOffset,
            MEMBERS_PAGE_SIZE
          )
          .pipe(
            map((invitationsResponse) => {
              return workspaceDetailEventActions.updateInvitationsListSuccess({
                members: invitationsResponse.members,
                totalMembers: invitationsResponse.totalMembers,
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

  public updateMembersNonMembersProjects$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceDetailEventActions.updateMembersNonMembersProjects),
      concatLatestFrom(() => [
        this.store.select(selectMembersOffset).pipe(filterNil()),
        this.store.select(selectNonMembersOffset).pipe(filterNil()),
      ]),
      exhaustMap(([action, membersOffset, nonMembersOffset]) => {
        return zip(
          this.workspaceApiService.getWorkspaceMembers(
            action.id,
            membersOffset,
            MEMBERS_PAGE_SIZE
          ),
          this.workspaceApiService.getWorkspaceNonMembers(
            action.id,
            nonMembersOffset,
            MEMBERS_PAGE_SIZE
          )
        ).pipe(
          map((response) => {
            return workspaceDetailEventActions.updateMembersNonMembersProjectsSuccess(
              {
                members: {
                  members: response[0].members,
                  totalMembers: response[0].totalMembers,
                  offset: membersOffset,
                },
                nonMembers: {
                  members: response[1].members,
                  totalMembers: response[1].totalMembers,
                  offset: nonMembersOffset,
                },
              }
            );
          }),
          catchError((httpResponse: HttpErrorResponse) => {
            this.appService.errorManagement(httpResponse);
            return EMPTY;
          })
        );
      })
    );
  });

  public leaveWorkspace$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceActions.leaveWorkspace),
      pessimisticUpdate({
        run: (action) => {
          return this.workspaceApiService
            .removeWorkspaceMember(action.id, action.username)
            .pipe(
              map(() => {
                return workspaceActions.leaveWorkspaceSuccess(action);
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.appService.toastGenericError(httpResponse);
        },
      })
    );
  });

  public leaveWorkspaceSucces$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(workspaceActions.leaveWorkspaceSuccess),
        tap((action) => {
          this.appService.toastNotification({
            message: 'workspace.people.remove.no_longer_member',
            paramsMessage: { workspace: action.name },
            status: TuiNotification.Info,
            closeOnNavigation: false,
            autoClose: true,
          });

          void this.router.navigate(['/']);
        })
      );
    },
    { dispatch: false }
  );

  constructor(
    private store: Store,
    private actions$: Actions,
    private workspaceApiService: WorkspaceApiService,
    private projectApiService: ProjectApiService,
    private appService: AppService,
    private router: Router
  ) {}
}
