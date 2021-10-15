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

import * as NewProjectActions from '~/app/features/project/new-project/actions/new-project.actions';
import { ProjectApiService } from '@taiga/api';
import { fetch } from '@nrwl/angular';
import { Project } from '@taiga/data';

@Injectable()
export class NewProjectEffects {

  public createProject$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(NewProjectActions.createProject),
      fetch({
        run: (action) => {
          return this.projectApiService.createProject(
            action.project
          ).pipe(
            map((project: Project) => {
              return NewProjectActions.createProjectSuccess({ project });
            })
          );
        },
        onError: () => {
          return NewProjectActions.createProjectError;
        },
      })
    );
  });

  constructor(
    private actions$: Actions,
    private projectApiService: ProjectApiService
  ) {}

}