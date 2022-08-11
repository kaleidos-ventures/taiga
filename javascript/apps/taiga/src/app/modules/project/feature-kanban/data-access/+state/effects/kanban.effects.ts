/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filterNil } from '~/app/shared/utils/operators';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { KanbanActions, KanbanApiActions } from '../actions/kanban.actions';
import { fetch } from '@nrwl/angular';
import { ProjectApiService } from '@taiga/api';
import { map } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AppService } from '~/app/services/app.service';

@Injectable()
export class KanbanEffects {
  public loadKanbanWorkflows$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(KanbanActions.initKanban),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      fetch({
        run: (action, project) => {
          return this.projectApiService
            .getWorkflows(project.slug)
            .pipe(
              map((workflows) =>
                KanbanApiActions.fetchWorkflowsSuccess({ workflows })
              )
            );
        },
        onError: (action, error: HttpErrorResponse) => {
          return this.appService.errorManagement(error);
        },
      })
    );
  });

  constructor(
    private appService: AppService,
    private actions$: Actions,
    private store: Store,
    private projectApiService: ProjectApiService
  ) {}
}
