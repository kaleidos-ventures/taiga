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

@Injectable()
export class WorkspaceEffects {

  public listWorkspaces$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WorkspaceActions.getWorkspaceList),
      fetch({
        run: (action) => {
          return this.workspaceApiService.fetchWorkspaceList(action.id).pipe(
            map((workspaces: Workspace[]) => {
              return WorkspaceActions.setWorkspaceList({ workspaces });
            }),
          );
        },
        onError: () => {
          return null;
        },
      })
    );
  });

  public addWorkspace$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WorkspaceActions.addWorkspace),
      pessimisticUpdate({
        run: (action) => {
          return this.workspaceApiService.addWorkspace({
            name: action.name,
            color: action.color,
          }).pipe(
            map(() => {
              return WorkspaceActions.getWorkspaceList({
                id: action.userId,
              });
            })
          );
        },
        onError: () => {
          return null;
        }
      })
    );
  });

  constructor(
    private actions$: Actions,
    private workspaceApiService: WorkspaceApiService
  ) {}

}
