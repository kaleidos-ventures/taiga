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
import {
  KanbanActions,
  KanbanApiActions,
  KanbanEventsActions,
} from '../actions/kanban.actions';
import { fetch, pessimisticUpdate } from '@nrwl/angular';
import { ProjectApiService } from '@taiga/api';
import { delay, filter, map } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AppService } from '~/app/services/app.service';
import { TuiNotification } from '@taiga-ui/core';
import { fetchProject } from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectWorkflows } from '../selectors/kanban.selectors';
import { KanbanStatusComponent } from '~/app/modules/project/feature-kanban/components/status/kanban-status.component';

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
              map((newTask) => {
                return KanbanApiActions.createTaskSuccess({
                  task: newTask,
                  tmpId: task.tmpId,
                });
              })
            );
        },
        onError: (action, httpResponse: HttpErrorResponse) => {
          if (httpResponse.status !== 401) {
            this.appService.errorManagement(httpResponse);
          }

          return KanbanApiActions.createTaskError({
            status: httpResponse.status,
            task: action.task,
          });
        },
      })
    );
  });

  public createTaskError$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(KanbanApiActions.createTaskError),
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

  // Remove the task from the global state after a while to prevent animate old tasks.
  // Example: the new task is in the scroll bottom, if the reference is not deleted is going
  // to be animate when it appears on the screen.
  public newTaskByEventAnimation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(KanbanEventsActions.newTask),
      delay(KanbanStatusComponent.slideInTime + 1),
      map((action) => {
        return KanbanActions.timeoutAnimationEventNewTask({
          reference: action.task.reference,
        });
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
