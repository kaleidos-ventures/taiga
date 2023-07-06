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
import { Store } from '@ngrx/store';
import { fetch, optimisticUpdate } from '@ngrx/router-store/data-persistence';
import { ProjectApiService } from '@taiga/api';
import { map } from 'rxjs';
import { AppService } from '~/app/services/app.service';
import {
  StoryDetailActions,
  StoryDetailApiActions,
} from '../actions/story-detail.actions';
import { storyDetailFeature } from '../reducers/story-detail.reducer';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { filterNil } from '~/app/shared/utils/operators';

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

  constructor(
    private store: Store,
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private appService: AppService
  ) {}
}
