/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { ProjectApiService } from '@taiga/api';
import { fetch, pessimisticUpdate } from '@nrwl/angular';
import { AppService } from '~/app/services/app.service';
import {
  StoryDetailActions,
  StoryDetailApiActions,
} from '../actions/story-detail.actions';
import { catchError, concatMap, EMPTY, map, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { filterNil } from '~/app/shared/utils/operators';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  selectStory,
  selectWorkflow,
} from '../selectors/story-detail.selectors';
import { TuiNotification } from '@taiga-ui/core';
import { selectWorkflows } from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';

@Injectable()
export class StoryDetailEffects {
  public loadStoryDetail$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StoryDetailActions.initStory),
      fetch({
        run: (action) => {
          return this.projectApiService
            .getStory(action.projectId, action.storyRef)
            .pipe(
              map((story) => {
                return StoryDetailApiActions.fetchStorySuccess({
                  story,
                });
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.errorManagement(httpResponse),
      })
    );
  });

  public loadWorkflow$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StoryDetailApiActions.fetchStorySuccess),
      concatLatestFrom(() => [
        this.store.select(selectWorkflows),
        this.store.select(selectWorkflow),
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      concatMap(([action, workflows, loadedWorkflow, project]) => {
        const workflow =
          loadedWorkflow ??
          workflows?.find(
            (workflow) => workflow.slug === action.story.workflow.slug
          );

        if (workflow?.slug === action.story.workflow.slug) {
          return of(
            StoryDetailApiActions.fetchWorkflowSuccess({
              workflow,
            })
          );
        }

        return this.projectApiService
          .getWorkflow(project?.id, action.story.workflow.slug)
          .pipe(
            map((workflow) => {
              return StoryDetailApiActions.fetchWorkflowSuccess({
                workflow,
              });
            }),
            catchError((httpResponse: HttpErrorResponse) => {
              this.appService.errorManagement(httpResponse);

              return EMPTY;
            })
          );
      })
    );
  });

  public updateStoryViewMode$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(StoryDetailActions.updateStoryViewMode),
        concatLatestFrom(() => [
          this.store.select(selectCurrentProject).pipe(filterNil()),
          this.store.select(selectStory).pipe(filterNil()),
        ]),
        map(([action, project, story]) => {
          this.localStorage.set('story_view', action.storyView);
          void this.router.navigate([
            `/project/${project.id}/${project.slug}/stories/${story.ref}`,
          ]);
        })
      );
    },
    { dispatch: false }
  );

  public updateStory$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StoryDetailActions.updateStory),
      pessimisticUpdate({
        run: (action) => {
          return this.projectApiService
            .updateStory(action.projectId, action.story)
            .pipe(
              map((story) =>
                StoryDetailApiActions.updateStorySuccess({ story })
              )
            );
        },
        onError: (action, httpResponse: HttpErrorResponse) => {
          if (httpResponse.status === 403) {
            this.appService.toastNotification({
              message: 'errors.modify_story_permission',
              status: TuiNotification.Error,
            });
          } else {
            this.appService.errorManagement(httpResponse, {
              any: {
                type: 'toast',
                options: {
                  label: 'errors.save_changes',
                  message: 'errors.please_refresh',
                  status: TuiNotification.Error,
                },
              },
            });
          }
        },
      })
    );
  });

  constructor(
    private store: Store,
    private localStorage: LocalStorageService,
    private router: Router,
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private appService: AppService
  ) {}
}
