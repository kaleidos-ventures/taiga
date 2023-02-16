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
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { fetch, pessimisticUpdate } from '@nrwl/angular';
import { WorkspaceApiService } from '@taiga/api';
import { timer, zip } from 'rxjs';
import { map } from 'rxjs/operators';
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

  constructor(
    private actions$: Actions,
    private workspaceApiService: WorkspaceApiService,
    private appService: AppService,
    private store: Store,
    private router: Router
  ) {}
}
