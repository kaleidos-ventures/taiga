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
import { fetch, pessimisticUpdate } from '@nrwl/angular';
import { ProjectApiService } from '@taiga/api';
import { filter, map } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AppService } from '~/app/services/app.service';
import { TuiNotification } from '@taiga-ui/core';
import { fetchProject } from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectWorkflows } from '../selectors/kanban.selectors';

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
          return this.projectApiService.getWorkflows(project.slug).pipe(
            map((workflows) => {
              return KanbanApiActions.fetchWorkflowsSuccess({ workflows });
            })
          );
        },
        onError: (action, error: HttpErrorResponse) => {
          return this.appService.errorManagement(error);
        },
      })
    );
  });

  public loadKanbanTasks$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(KanbanActions.initKanban),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
        this.store.select(selectWorkflows),
      ]),
      fetch({
        run: (action, project) => {
          return this.projectApiService.getAllTasks(project.slug, 'main').pipe(
            map(({ tasks, offset }) => {
              return KanbanApiActions.fetchTasksSuccess({ tasks, offset });
            })
          );
        },
        onError: (action, error: HttpErrorResponse) => {
          return this.appService.errorManagement(error);
        },
      })
    );
  });

  public createTask$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(KanbanActions.createTask),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      pessimisticUpdate({
        run: ({ task, workflow }, project) => {
          return this.projectApiService
            .createTask(task, project.slug, workflow)
            .pipe(
              map((task) => {
                return KanbanApiActions.createTasksSuccess({ task });
              })
            );
        },
        onError: (action, httpResponse: HttpErrorResponse) => {
          if (httpResponse.status !== 401) {
            this.appService.errorManagement(httpResponse);
          }

          return KanbanApiActions.createTasksError({
            status: httpResponse.status,
            task: action.task,
          });
        },
      })
    );
  });

  public createTaskError$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(KanbanApiActions.createTasksError),
      filter((error) => error.status === 401),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      map(([, project]) => {
        this.appService.toastNotification({
          message: 'create_task_permission',
          status: TuiNotification.Error,
          scope: 'kanban',
        });

        return fetchProject({ slug: project.slug });
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
