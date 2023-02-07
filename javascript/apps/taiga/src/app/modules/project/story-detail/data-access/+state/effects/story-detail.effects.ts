/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { fetch, pessimisticUpdate } from '@nrwl/angular';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService } from '@taiga/api';
import { catchError, concatMap, EMPTY, map, of, tap } from 'rxjs';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { selectWorkflows } from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import { AppService } from '~/app/services/app.service';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { filterNil } from '~/app/shared/utils/operators';
import {
  StoryDetailActions,
  StoryDetailApiActions,
} from '../actions/story-detail.actions';
import {
  selectStory,
  selectWorkflow,
} from '../selectors/story-detail.selectors';

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

  public deleteStory$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StoryDetailActions.deleteStory),
      pessimisticUpdate({
        run: (action) => {
          return this.projectApiService
            .deleteStory(action.project.id, action.ref)
            .pipe(
              map(() => {
                return StoryDetailApiActions.deleteStorySuccess({
                  project: action.project,
                  ref: action.ref,
                });
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.appService.errorManagement(httpResponse, {
            any: {
              type: 'toast',
              options: {
                label: 'errors.generic_toast_label',
                message: 'errors.generic_toast_message',
                status: TuiNotification.Error,
              },
            },
          });
        },
      })
    );
  });

  public deleteStoryRedirect$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(StoryDetailApiActions.deleteStorySuccess),
        tap((action) => {
          this.appService.toastNotification({
            message: 'delete.confirm_delete',
            paramsMessage: { ref: action.ref },
            status: TuiNotification.Info,
            scope: 'story',
            autoClose: true,
            closeOnNavigation: false,
          });
          void this.router.navigate([
            `/project/${action.project.id}/${action.project.slug}/kanban`,
          ]);
        })
      );
    },
    { dispatch: false }
  );

  public assign$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StoryDetailActions.assignMember),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      pessimisticUpdate({
        run: (action, project) => {
          return this.projectApiService
            .assingStory(project.id, action.storyRef, action.member.username)
            .pipe(
              map(() => {
                return StoryDetailApiActions.assignMemberSuccess();
              })
            );
        },
        onError: (action, httpResponse: HttpErrorResponse) => {
          if (httpResponse.status !== 403) {
            this.appService.errorManagement(httpResponse);
          }

          return StoryDetailApiActions.assignMemberError({
            status: httpResponse.status,
            ref: action.storyRef,
            member: action.member,
          });
        },
      })
    );
  });

  public unAssign$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StoryDetailActions.unassignMember),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      pessimisticUpdate({
        run: (action, project) => {
          return this.projectApiService
            .unAssignStory(project.id, action.storyRef, action.member.username)
            .pipe(
              map(() => {
                return StoryDetailApiActions.unassignMemberSuccess();
              })
            );
        },
        onError: (action, httpResponse: HttpErrorResponse) => {
          if (httpResponse.status !== 403) {
            this.appService.errorManagement(httpResponse);
          }

          this.appService.toastNotification({
            message: 'errors.modify_story_permission',
            status: TuiNotification.Error,
          });

          return StoryDetailApiActions.unassignMemberError({
            status: httpResponse.status,
            ref: action.storyRef,
            member: action.member,
          });
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
