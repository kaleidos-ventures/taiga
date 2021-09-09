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

import * as ProjectActions from '../actions/project.actions';
import { ProjectApiService } from '@taiga/api';
import { fetch } from '@nrwl/angular';
import { Project } from '@taiga/data';


@Injectable()
export class ProjectEffects {


  public loadProject$ = createEffect(() => {
    return this.actions$.pipe( 
      ofType(ProjectActions.getProject),
      fetch({
        run: (action) => {
          return this.projectApiService.getProject(action.id).pipe(
            map((project: Project) => {
              return ProjectActions.setProject({ project });
            })
          );
        }
      })
    );
  });


  constructor(
    private actions$: Actions,
    private projectApiService: ProjectApiService
  ) {}

}
