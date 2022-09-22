/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { HttpErrorResponse } from '@angular/common/http';
import { fetch, pessimisticUpdate } from '@nrwl/angular';
import { WorkspaceApiService } from '@taiga/api';
import { timer, zip } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppService } from '~/app/services/app.service';
import * as WorkspaceActions from '../actions/workspace-detail.actions';

@Injectable()
export class WorkspaceDetailEffects {
  public loadWorkspace$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WorkspaceActions.fetchWorkspace),
      fetch({
        run: (action) => {
          return this.workspaceApiService
            .fetchWorkspaceDetail(action.slug)
            .pipe(
              map((workspace) => {
                return WorkspaceActions.fetchWorkspaceSuccess({ workspace });
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
      ofType(WorkspaceActions.fetchWorkspace),
      fetch({
        run: (action) => {
          return zip(
            this.workspaceApiService.fetchWorkspaceProjects(action.slug),
            this.workspaceApiService.fetchWorkspaceInvitedProjects(action.slug),
            timer(1000)
          ).pipe(
            map(([projects, invitedProjects]) => {
              return WorkspaceActions.fetchWorkspaceProjectsSuccess({
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
      ofType(WorkspaceActions.invitationDetailCreateEvent),
      pessimisticUpdate({
        run: (action) => {
          return zip(
            this.workspaceApiService.fetchWorkspaceProjects(
              action.workspaceSlug
            ),
            this.workspaceApiService.fetchWorkspaceInvitedProjects(
              action.workspaceSlug
            ),
            timer(300)
          ).pipe(
            map(([project, invitations]) => {
              return WorkspaceActions.fetchWorkspaceDetailInvitationsSuccess({
                projectSlug: action.projectSlug,
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

  constructor(
    private actions$: Actions,
    private workspaceApiService: WorkspaceApiService,
    private appService: AppService
  ) {}
}
