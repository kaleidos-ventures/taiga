/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { map } from 'rxjs/operators';

import * as WorkspaceActions from '../actions/workspace.actions';
import { fetch, pessimisticUpdate } from '@nrwl/angular';
import { Workspace } from '@taiga/data';
import { WorkspaceApiService } from '@taiga/api';
import { AppService } from '~/app/services/app.service';
import { timer, zip } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class WorkspaceEffects {
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
          this.appService.unexpectedError(httpResponse),
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
              // #TODO: When back give us this info, remove all modifications.
              workspace.myRole = 'admin';
              workspace.isOwner = true;
              workspace.hasProjects = false;
              workspace.isPremium = true;
              workspace.totalProjects = 0;
              return WorkspaceActions.createWorkspaceSuccess({ workspace });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.toastError(httpResponse, {
            label: 'errors.create_workspace',
            message: 'errors.please_refresh',
          }),
      })
    );
  });

  public fetchWorkspaceProjects$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WorkspaceActions.fetchWorkspaceProjects),
      pessimisticUpdate({
        run: (action) => {
          return this.workspaceApiService
            .fetchWorkspaceProjects(action.slug)
            .pipe(
              map((projects) => {
                return WorkspaceActions.fetchWorkspaceProjectsSuccess({
                  slug: action.slug,
                  projects,
                });
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.unexpectedError(httpResponse),
      })
    );
  });

  constructor(
    private actions$: Actions,
    private workspaceApiService: WorkspaceApiService,
    private appService: AppService
  ) {}
}
