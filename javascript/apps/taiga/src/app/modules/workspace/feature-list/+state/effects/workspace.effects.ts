/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { fetch, pessimisticUpdate } from '@nrwl/angular';
import { TuiNotification } from '@taiga-ui/core';
import { WorkspaceApiService } from '@taiga/api';
import { Project, Workspace } from '@taiga/data';
import { timer, zip } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppService } from '~/app/services/app.service';
import { UserStorageService } from '~/app/shared/user-storage/user-storage.service';
import * as WorkspaceActions from '../actions/workspace.actions';

@Injectable()
export class WorkspaceEffects {
  public initWorkspaceFetchList$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WorkspaceActions.initWorkspaceList),
      map(() => {
        return WorkspaceActions.fetchWorkspaceList();
      })
    );
  });

  public setRejectedInvites$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WorkspaceActions.initWorkspaceList),
      map(() => {
        const rejectedInvites =
          this.userStorageService.get<Project['id'][] | undefined>(
            'general_rejected_invites'
          ) ?? [];

        return WorkspaceActions.setWorkspaceListRejectedInvites({
          projects: rejectedInvites,
        });
      })
    );
  });

  public listWorkspaces$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WorkspaceActions.fetchWorkspaceList),
      fetch({
        run: () => {
          return this.workspaceApiService.fetchWorkspaceList().pipe(
            map((workspaces: Workspace[]) => {
              return WorkspaceActions.fetchWorkspaceListSuccess({ workspaces });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.errorManagement(httpResponse),
      })
    );
  });

  public createWorkspace$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WorkspaceActions.createWorkspace),
      pessimisticUpdate({
        run: (action) => {
          return zip(
            this.workspaceApiService.createWorkspace({
              name: action.name,
              color: action.color,
            }),
            timer(1000)
          ).pipe(
            map(([workspace]) => {
              return WorkspaceActions.createWorkspaceSuccess({ workspace });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.appService.errorManagement(httpResponse, {
            500: {
              type: 'toast',
              options: {
                label: 'errors.login',
                message: 'errors.please_refresh',
                status: TuiNotification.Error,
              },
            },
          });
          return WorkspaceActions.createWorkspaceError();
        },
      })
    );
  });

  public fetchWorkspaceProjects$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WorkspaceActions.fetchWorkspaceProjects),
      pessimisticUpdate({
        run: (action) => {
          return zip(
            this.workspaceApiService.fetchWorkspaceProjects(action.id),
            timer(300)
          ).pipe(
            map(([projects]) => {
              return WorkspaceActions.fetchWorkspaceProjectsSuccess({
                id: action.id,
                projects,
              });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.errorManagement(httpResponse),
      })
    );
  });

  public invitationCreateEvent$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WorkspaceActions.invitationCreateEvent),
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
              return WorkspaceActions.fetchWorkspaceInvitationsSuccess({
                projectId: action.projectId,
                workspaceId: action.workspaceId,
                project,
                invitations,
                role: action.role,
                rejectedInvites: action.rejectedInvites,
              });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.errorManagement(httpResponse),
      })
    );
  });

  public fetchWorkspace$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WorkspaceActions.fetchWorkspace),
      pessimisticUpdate({
        run: (action) => {
          return zip(
            this.workspaceApiService.fetchWorkspace(action.workspaceId),
            timer(300)
          ).pipe(
            map(([workspace]) => {
              return WorkspaceActions.fetchWorkspaceSuccess({
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

  constructor(
    private userStorageService: UserStorageService,
    private actions$: Actions,
    private workspaceApiService: WorkspaceApiService,
    private appService: AppService
  ) {}
}
