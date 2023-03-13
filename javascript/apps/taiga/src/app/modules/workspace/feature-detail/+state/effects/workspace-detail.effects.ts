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
import { fetch, optimisticUpdate, pessimisticUpdate } from '@nrwl/angular';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService, WorkspaceApiService } from '@taiga/api';
import { timer, zip } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { workspaceDetailEventActions } from '~/app/modules/workspace/feature-detail/+state/actions/workspace-detail.actions';
import { AppService } from '~/app/services/app.service';
import * as WorkspaceDetailActions from '../actions/workspace-detail.actions';

@Injectable()
export class WorkspaceDetailEffects {
  public loadWorkspace$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WorkspaceDetailActions.fetchWorkspace),
      fetch({
        run: (action) => {
          return this.workspaceApiService.fetchWorkspaceDetail(action.id).pipe(
            map((workspace) => {
              return WorkspaceDetailActions.fetchWorkspaceSuccess({
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
      ofType(WorkspaceDetailActions.fetchWorkspace),
      fetch({
        run: (action) => {
          return zip(
            this.workspaceApiService.fetchWorkspaceProjects(action.id),
            this.workspaceApiService.fetchWorkspaceInvitedProjects(action.id),
            timer(1000)
          ).pipe(
            map(([projects, invitedProjects]) => {
              return WorkspaceDetailActions.fetchWorkspaceProjectsSuccess({
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
      ofType(WorkspaceDetailActions.invitationDetailCreateEvent),
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
              return WorkspaceDetailActions.fetchWorkspaceDetailInvitationsSuccess(
                {
                  projectId: action.projectId,
                  project,
                  invitations,
                  role: action.role,
                }
              );
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
              return WorkspaceDetailActions.fetchWorkspaceSuccess({
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
      ofType(WorkspaceDetailActions.updateWorkspace),
      optimisticUpdate({
        run: ({ currentWorkspace, nextWorkspace }) => {
          return this.workspaceApiService
            .updateWorkspace(currentWorkspace.id, nextWorkspace)
            .pipe(
              map((workspace) => {
                return WorkspaceDetailActions.updateWorkspaceSuccess({
                  workspace,
                });
              })
            );
        },
        undoAction: ({ currentWorkspace }) => {
          return WorkspaceDetailActions.updateWorkspaceError({
            workspace: currentWorkspace,
          });
        },
      })
    );
  });

  public updateWorkspaceSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(WorkspaceDetailActions.updateWorkspaceSuccess),
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
      ofType(WorkspaceDetailActions.deleteWorkspace),
      pessimisticUpdate({
        run: (action) => {
          return this.workspaceApiService.deleteWorkspace(action.id).pipe(
            map(() => {
              return WorkspaceDetailActions.deleteWorkspaceSuccess({
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
        ofType(WorkspaceDetailActions.deleteWorkspaceSuccess),
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
          console.log('kick del detalle al usuario');
          this.appService.toastNotification({
            message: 'delete.deleted_worspace',
            paramsMessage: { name: action.name },
            status: TuiNotification.Error,
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

  public deleteWorkspaceProject$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WorkspaceDetailActions.deleteWorkspaceProject),
      pessimisticUpdate({
        run: (action) => {
          return this.projectApiService.deleteProject(action.projectId).pipe(
            map(() => {
              return WorkspaceDetailActions.deleteWorkspaceProjectSuccess({
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
        ofType(WorkspaceDetailActions.deleteWorkspaceProjectSuccess),
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

  constructor(
    private actions$: Actions,
    private workspaceApiService: WorkspaceApiService,
    private projectApiService: ProjectApiService,
    private appService: AppService,
    private router: Router
  ) {}
}
