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
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  fetch,
  optimisticUpdate,
  pessimisticUpdate,
} from '@ngrx/router-store/data-persistence';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService, WorkspaceApiService } from '@taiga/api';
import { timer, zip } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AppService } from '~/app/services/app.service';
import {
  workspaceActions,
  workspaceDetailActions,
  workspaceDetailEventActions,
} from '../actions/workspace-detail.actions';
import { Store } from '@ngrx/store';
@Injectable()
export class WorkspaceDetailEffects {
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
