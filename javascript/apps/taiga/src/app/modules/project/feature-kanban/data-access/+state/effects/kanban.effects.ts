/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  fetch,
  optimisticUpdate,
  pessimisticUpdate,
} from '@ngrx/router-store/data-persistence';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService } from '@taiga/api';
import { Story } from '@taiga/data';
import { delay, filter, finalize, map, tap } from 'rxjs';
import { fetchProject } from '~/app/modules/project/data-access/+state/actions/project.actions';
import {
  selectCurrentProject,
  selectCurrentProjectId,
} from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { KanbanStatusComponentSlideInTime } from '~/app/modules/project/feature-kanban/components/status/kanban-status.component';
import { KanbanScrollManagerService } from '~/app/modules/project/feature-kanban/custom-scroll-strategy/kanban-scroll-manager.service';
import { StoryDetailActions } from '~/app/modules/project/story-detail/data-access/+state/actions/story-detail.actions';
import { AppService } from '~/app/services/app.service';
import { filterNil } from '~/app/shared/utils/operators';
import {
  KanbanActions,
  KanbanApiActions,
  KanbanEventsActions,
} from '../actions/kanban.actions';
import {
  selectCurrentWorkflowSlug,
  selectWorkflows,
} from '../selectors/kanban.selectors';

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
          return this.projectApiService.getWorkflows(project.id).pipe(
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
          return this.projectApiService.getAllStories(project.id, 'main').pipe(
            map(({ stories, offset, complete }) => {
              return KanbanApiActions.fetchStoriesSuccess({
                stories,
                offset,
                complete,
              });
            }),
            finalize(() => {
              return KanbanActions.loadStoriesComplete();
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
            .createStory(story, project.id, workflow)
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

        return fetchProject({ id: project.id });
      })
    );
  });

  // Remove the story from the global state after a while to prevent animate old stories.
  // Example: the new story is in the scroll bottom, if the reference is not deleted is going
  // to be animate when it appears on the screen.
  public newStoryByEventAnimation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(KanbanEventsActions.newStory),
      delay(KanbanStatusComponentSlideInTime + 1),
      map((action) => {
        return KanbanActions.timeoutAnimationEventNewStory({
          ref: action.story.ref,
        });
      })
    );
  });

  public deleteStoryByEvent$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(KanbanEventsActions.deleteStory),
      map((action) => {
        return KanbanActions.deleteStory({
          ref: action.ref,
        });
      })
    );
  });

  public moveStoryKeyboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(KanbanActions.dropStoryA11y),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      optimisticUpdate({
        run: ({ story, workflow, reorder }, project) => {
          const storyData = {
            ref: story.ref!,
            status: story.currentPosition.status,
          };
          return this.projectApiService
            .moveStory(storyData, project.id, workflow.slug, reorder)
            .pipe(
              map((reorder) => {
                return KanbanApiActions.moveStorySuccess({
                  reorder,
                });
              })
            );
        },
        undoAction: (action, httpResponse: HttpErrorResponse) => {
          return KanbanApiActions.moveStoryError({
            story: action.story.ref!,
            errorStatus: httpResponse.status,
          });
        },
      })
    );
  });

  public moveStoryMouse$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(KanbanActions.storyDropped),
      filter((action) => !!action.status),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProjectId).pipe(filterNil()),
        this.store.select(selectCurrentWorkflowSlug),
      ]),
      optimisticUpdate({
        run: (action, project, workflow) => {
          let reorder:
            | {
                place: 'before' | 'after';
                ref: Story['ref'];
              }
            | undefined;

          if (action.candidate) {
            reorder = {
              place: action.candidate.position === 'top' ? 'before' : 'after',
              ref: action.candidate.ref,
            };
          }

          return this.projectApiService
            .moveStory(
              {
                ref: action.ref,
                status: action.status!,
              },
              project,
              workflow,
              reorder
            )
            .pipe(
              map((reorder) => {
                return KanbanApiActions.moveStorySuccess({
                  reorder,
                });
              })
            );
        },
        undoAction: (action, httpResponse: HttpErrorResponse) => {
          return KanbanApiActions.moveStoryError({
            errorStatus: httpResponse.status,
            story: action.ref,
          });
        },
      })
    );
  });

  public moveStoryError$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(KanbanApiActions.moveStoryError),
        filter((error) => error.errorStatus === 403),
        tap(() => {
          this.appService.toastNotification({
            message: 'errors.lose_story_permissions',
            paramsMessage: {
              permission: this.translocoService.translate('commons.modify'),
            },
            status: TuiNotification.Error,
            autoClose: true,
            closeOnNavigation: false,
          });
        })
      );
    },
    { dispatch: false }
  );

  public loadStoryDetailSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(StoryDetailActions.initStory),
        tap((action) => {
          this.kanbanScrollManagerService
            .scrollToRef(action.storyRef)
            .subscribe();
        })
      );
    },
    { dispatch: false }
  );

  public assign$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(KanbanActions.assignMember),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      pessimisticUpdate({
        run: (action, project) => {
          return this.projectApiService
            .assingStory(project.id, action.storyRef, action.member.username)
            .pipe(
              map(() => {
                return KanbanApiActions.assignMemberSuccess();
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
      ofType(KanbanActions.unAssignMember),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      pessimisticUpdate({
        run: (action, project) => {
          return this.projectApiService
            .unAssignStory(project.id, action.storyRef, action.member.username)
            .pipe(
              map(() => {
                return KanbanApiActions.unAssignMemberSuccess();
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.appService.toastSaveChangesError(httpResponse);
        },
      })
    );
  });

  public createStatus$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(KanbanActions.createStatus),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      pessimisticUpdate({
        run: ({ status, workflow }, project) => {
          return this.projectApiService
            .createStatus(project.id, status, workflow)
            .pipe(
              map((newStatus) => {
                return KanbanApiActions.createStatusSuccess({
                  status: newStatus,
                  workflow,
                });
              })
            );
        },
        onError: (action, httpResponse: HttpErrorResponse) => {
          if (httpResponse.status !== 403) {
            this.appService.errorManagement(httpResponse);
          }

          return KanbanApiActions.createStatusError({
            statusError: httpResponse.status,
            status: action.status.name,
          });
        },
      })
    );
  });

  constructor(
    private appService: AppService,
    private actions$: Actions,
    private store: Store,
    private projectApiService: ProjectApiService,
    private kanbanScrollManagerService: KanbanScrollManagerService,
    private translocoService: TranslocoService
  ) {}
}
