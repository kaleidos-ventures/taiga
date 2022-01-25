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

import * as WorkspaceActions from '../actions/workspace-detail.actions';
import { fetch } from '@nrwl/angular';
import { WorkspaceApiService } from '@taiga/api';

@Injectable()
export class WorkspaceDetailEffects {
  public loadWorkspace$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WorkspaceActions.fetchWorkspace),
      fetch({
        run: (action) => {
          return this.workspaceApiService.fetchWorkspace(action.slug).pipe(
            map((workspace) => {
              return WorkspaceActions.fetchWorkspaceSuccess({ workspace });
            })
          );
        },
        onError: () => {
          return null;
        },
      })
    );
  });

  public loadWorkspaceProject$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WorkspaceActions.fetchWorkspace),
      fetch({
        run: (action) => {
          return this.workspaceApiService
            .fetchWorkspaceProjects(action.slug)
            .pipe(
              map((projects) => {
                return WorkspaceActions.fetchWorkspaceProjectsSuccess({
                  projects,
                });
              })
            );
        },
        onError: () => {
          return null;
        },
      })
    );
  });

  constructor(
    private actions$: Actions,
    private workspaceApiService: WorkspaceApiService
  ) {}
}
