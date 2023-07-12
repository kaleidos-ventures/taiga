/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import {
  fetch,
  optimisticUpdate,
  pessimisticUpdate,
} from '@ngrx/router-store/data-persistence';
import { Store } from '@ngrx/store';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService } from '@taiga/api';
import { ErrorManagementOptions } from '@taiga/data';
import { map } from 'rxjs';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { AppService } from '~/app/services/app.service';
import { filterNil } from '~/app/shared/utils/operators';
import {
  StoryDetailActions,
  StoryDetailApiActions,
} from '../actions/story-detail.actions';
import { storyDetailFeature } from '../reducers/story-detail.reducer';

@Injectable()
export class StoryDetailCommentsEffects {
  public redirectToFetchComments$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StoryDetailActions.initStory, StoryDetailActions.nextCommentPage),
      concatLatestFrom(() => [
        this.store
          .select(storyDetailFeature.selectComments)
          .pipe(map((comments) => comments?.length ?? 0)),
        this.store.select(storyDetailFeature.selectCommentsOrder),
      ]),
      map(([action, offset, order]) => {
        return StoryDetailApiActions.fetchComments({
          projectId: action.projectId,
          storyRef: action.storyRef,
          order,
          offset,
        });
      })
    );
  });

  public changeOrderComments$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StoryDetailActions.changeOrderComments),
      map((action) => {
        return StoryDetailApiActions.fetchComments({
          projectId: action.projectId,
          storyRef: action.storyRef,
          order: action.order,
          offset: 0,
        });
      })
    );
  });

  public fetchComments$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StoryDetailApiActions.fetchComments),
      fetch({
        run: ({ projectId, storyRef, offset, order }) => {
          return this.projectApiService
            .getComments(projectId, storyRef, order, offset, 40)
            .pipe(
              map(({ comments, total }) => {
                return StoryDetailApiActions.fetchCommentsSuccess({
                  comments,
                  total,
                  order,
                  offset,
                });
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.appService.toastGenericError(httpResponse);
        },
      })
    );
  });

  public newComent$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StoryDetailActions.newComment),
      optimisticUpdate({
        run: ({ storyRef, projectId, comment, tmpId }) => {
          return this.projectApiService
            .newComment(projectId, storyRef, comment)
            .pipe(
              concatLatestFrom(() => [
                this.store.select(selectUser).pipe(filterNil()),
              ]),
              map(([comment, user]) => {
                return StoryDetailApiActions.newCommentSuccess({
                  tmpId,
                  storyRef,
                  projectId,
                  comment,
                  user,
                });
              })
            );
        },
        undoAction: (action, httpResponse: HttpErrorResponse) => {
          this.appService.toastGenericError(httpResponse);

          return StoryDetailApiActions.newCommentError(action);
        },
      })
    );
  });

  public editComment$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StoryDetailActions.editComment),
      pessimisticUpdate({
        run: ({ commentId, text, storyRef, projectId }) => {
          return this.projectApiService
            .editComment(commentId, text, storyRef, projectId)
            .pipe(
              map((response) => {
                return StoryDetailApiActions.editCommentSuccess({
                  comment: response,
                });
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.appService.toastGenericError(httpResponse);
        },
      })
    );
  });

  public deleteComment$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StoryDetailActions.deleteComment),
      pessimisticUpdate({
        run: ({ commentId, projectId, storyRef, deletedBy }) => {
          return this.projectApiService
            .deleteComment(projectId, commentId, storyRef)
            .pipe(
              map(() => {
                return StoryDetailApiActions.deleteCommentSuccess({
                  commentId,
                  deletedBy,
                });
              })
            );
        },
        onError: ({ commentId }, httpResponse: HttpErrorResponse) => {
          const status = httpResponse.status as keyof ErrorManagementOptions;
          if (status === 404) {
            this.appService.toastNotification({
              message: 'deleted.already_deleted_message',
              status: TuiNotification.Info,
              scope: 'comments',
              autoClose: true,
            });
            return StoryDetailApiActions.deleteCommentSuccess({
              commentId,
              deletedBy: {},
            });
          }
          return this.appService.toastGenericError(httpResponse);
        },
      })
    );
  });

  constructor(
    private store: Store,
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private appService: AppService
  ) {}
}
