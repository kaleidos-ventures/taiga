/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { fetch, pessimisticUpdate } from '@ngrx/router-store/data-persistence';
import { Store } from '@ngrx/store';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService } from '@taiga/api';
import { EMPTY, catchError, concatMap, map, of, tap } from 'rxjs';
import { projectEventActions } from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { KanbanActions } from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import { selectWorkflow } from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import { AppService } from '~/app/services/app.service';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { filterNil } from '~/app/shared/utils/operators';
import {
  StoryDetailActions,
  StoryDetailApiActions,
} from '../actions/story-detail.actions';
import { selectStory } from '../selectors/story-detail.selectors';

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
      ofType(
        StoryDetailApiActions.fetchStorySuccess,
        StoryDetailApiActions.updateStoryWorkflowSuccess
      ),
      concatLatestFrom(() => [
        this.store.select(selectWorkflow),
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      concatMap(([action, loadedWorkflow, project]) => {
        const workflow =
          loadedWorkflow ??
          project.workflows?.find(
            (workflow) => workflow.slug === action.story.workflow.slug
          );
        if (!workflow?.statuses) {
          return of(
            KanbanActions.initKanban({ workflow: action.story.workflow.slug })
          );
        }
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
          const previousStoryView = this.localStorage.get('story_view');
          this.localStorage.set('story_view', action.storyView);

          if (previousStoryView === 'full-view') {
            void this.router.navigate([
              `/project/${project.id}/${project.slug}/stories/${story.ref}`,
            ]);
          }
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
              message: 'errors.lose_story_permissions',
              paramsMessage: {
                permission: this.translocoService.translate('commons.modify'),
              },
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

  public updateStoryWorkflow$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StoryDetailActions.updateStoryWorkflow),
      pessimisticUpdate({
        run: (action) => {
          return this.projectApiService
            .updateStory(action.projectId, action.story)
            .pipe(
              map((story) =>
                StoryDetailApiActions.updateStoryWorkflowSuccess({ story })
              )
            );
        },
        onError: (action, httpResponse: HttpErrorResponse) => {
          if (httpResponse.status === 400) {
            this.appService.toastNotification({
              message: 'move.error',
              paramsMessage: { workflow: action.workflow.name },
              status: TuiNotification.Error,
              scope: 'story',
              autoClose: true,
              closeOnNavigation: false,
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
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.appService.toastSaveChangesError(httpResponse);
        },
      })
    );
  });

  public unAssign$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StoryDetailActions.unAssignMember),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      pessimisticUpdate({
        run: (action, project) => {
          return this.projectApiService
            .unAssignStory(project.id, action.storyRef, action.member.username)
            .pipe(
              map(() => {
                return StoryDetailApiActions.unAssignMemberSuccess();
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.appService.toastSaveChangesError(httpResponse);
        },
      })
    );
  });

  public updatesWorkflowStatusAfterDragAndDrop$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(KanbanActions.statusDropped, projectEventActions.statusReorder),
      concatLatestFrom(() => this.store.select(selectWorkflow)),
      map(([, workflow]) => {
        if (workflow) {
          return StoryDetailActions.newStatusOrderAfterDrag({
            workflow,
          });
        }

        return null;
      }),
      filterNil()
    );
  });

  constructor(
    private store: Store,
    private localStorage: LocalStorageService,
    private router: Router,
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private appService: AppService,
    private translocoService: TranslocoService
  ) {}
}
