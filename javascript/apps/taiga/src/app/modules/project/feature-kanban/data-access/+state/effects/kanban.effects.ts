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

  public loadKanbanStories$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(KanbanActions.initKanban),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
        this.store.select(selectWorkflows),
      ]),
      fetch({
        run: (action, project) => {
          return this.projectApiService
            .getAllStories(project.slug, 'main')
            .pipe(
              map(({ stories, offset }) => {
                return KanbanApiActions.fetchStoriesSuccess({
                  stories,
                  offset,
                });
              })
            );
        },
        onError: (action, error: HttpErrorResponse) => {
          return this.appService.errorManagement(error);
        },
      })
    );
  });

  public createStory$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(KanbanActions.createStory),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      pessimisticUpdate({
        run: ({ story, workflow }, project) => {
          return this.projectApiService
            .createStory(story, project.slug, workflow)
            .pipe(
              map((newStory) => {
                return KanbanApiActions.createStorySuccess({
                  story: newStory,
                  tmpId: story.tmpId,
                });
              })
            );
        },
        onError: (action, httpResponse: HttpErrorResponse) => {
          if (httpResponse.status !== 403) {
            this.appService.errorManagement(httpResponse);
          }

          return KanbanApiActions.createStoryError({
            status: httpResponse.status,
            story: action.story,
          });
        },
      })
    );
  });

  public createStoryError$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(KanbanApiActions.createStoryError),
      filter((error) => error.status === 403),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      map(([, project]) => {
        this.appService.toastNotification({
          message: 'create_story_permission',
          status: TuiNotification.Error,
          scope: 'kanban',
        });

        return fetchProject({ slug: project.slug });
      })
    );
  });

  // Remove the story from the global state after a while to prevent animate old stories.
  // Example: the new story is in the scroll bottom, if the reference is not deleted is going
  // to be animate when it appears on the screen.
  public newStoryByEventAnimation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(KanbanEventsActions.newStory),
      delay(KanbanStatusComponent.slideInTime + 1),
      map((action) => {
        return KanbanActions.timeoutAnimationEventNewStory({
          ref: action.story.ref,
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
