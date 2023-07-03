/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Router } from '@angular/router';
import { randUuid } from '@ngneat/falso';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ProjectApiService } from '@taiga/api';
import {
  StoryDetailMockFactory,
  UserCommentMockFactory,
  UserMockFactory,
} from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { Observable } from 'rxjs';

import { AppService } from '~/app/services/app.service';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import {
  StoryDetailActions,
  StoryDetailApiActions,
} from '../actions/story-detail.actions';
import { StoryDetailCommentsEffects } from './story-detail-comments.effects';
import { storyDetailFeature } from '../reducers/story-detail.reducer';
import { HttpErrorResponse } from '@angular/common/http';
import { projectEventActions } from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';

describe('StoryDetailEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<StoryDetailCommentsEffects>;
  let store: MockStore;

  const createService = createServiceFactory({
    service: StoryDetailCommentsEffects,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({ initialState: {} }),
    ],
    imports: [getTranslocoModule()],
    mocks: [ProjectApiService, AppService, Router, LocalStorageService],
  });

  beforeEach(() => {
    spectator = createService();
    store = spectator.inject(MockStore);
  });
  it('initStory - should redirect to fetchComments action', () => {
    const effects = spectator.inject(StoryDetailCommentsEffects);
    const story = StoryDetailMockFactory();
    const projectId = randUuid();

    const comments = [UserCommentMockFactory(), UserCommentMockFactory()];

    store.overrideSelector(storyDetailFeature.selectCommentsOrder, 'createdAt');
    store.overrideSelector(storyDetailFeature.selectComments, comments);

    const action = StoryDetailActions.initStory({
      projectId,
      storyRef: story.ref,
    });
    const outcome = StoryDetailApiActions.fetchComments({
      projectId,
      storyRef: story.ref,
      order: 'createdAt',
      offset: 2,
    });

    actions$ = hot('-a', { a: action });
    const expected = hot('-b', { b: outcome });

    expect(effects.redirectToFetchComments$).toBeObservable(expected);
  });

  it('changeOrderComments - should redirect to fetchComments action', () => {
    const effects = spectator.inject(StoryDetailCommentsEffects);
    const story = StoryDetailMockFactory();
    const projectId = randUuid();
    const action = StoryDetailActions.changeOrderComments({
      projectId,
      storyRef: story.ref,
      order: 'createdAt',
    });
    const outcome = StoryDetailApiActions.fetchComments({
      projectId,
      storyRef: story.ref,
      order: 'createdAt',
      offset: 0,
    });

    actions$ = hot('-a', { a: action });
    const expected = hot('-b', { b: outcome });

    expect(effects.changeOrderComments$).toBeObservable(expected);
  });

  it('should fetch comments successfully', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const story = StoryDetailMockFactory();
    const projectId = randUuid();
    const action = StoryDetailApiActions.fetchComments({
      projectId,
      storyRef: story.ref,
      order: 'createdAt',
      offset: 0,
    });
    const effects = spectator.inject(StoryDetailCommentsEffects);
    const comments = [UserCommentMockFactory(), UserCommentMockFactory()];
    const outcome = StoryDetailApiActions.fetchCommentsSuccess({
      comments: comments,
      total: comments.length,
      order: 'createdAt',
      offset: 0,
    });

    actions$ = hot('-a', { a: action });
    const response = cold('-a|', { a: { comments, total: comments.length } });
    const expected = cold('--b', { b: outcome });

    projectApiService.getComments.mockReturnValue(response);

    expect(effects.fetchComments$).toBeObservable(expected);
  });

  describe('newComment$', () => {
    it('should dispatch newCommentSuccess action on successful new comment', () => {
      const projectApiService = spectator.inject(ProjectApiService);
      const effects = spectator.inject(StoryDetailCommentsEffects);
      const comment = 'Test comment';
      const storyRef = 123;
      const projectId = 'testProject';
      const user = UserMockFactory();

      store.overrideSelector(selectUser, user);

      const action = StoryDetailActions.newComment({
        storyRef,
        projectId,
        comment,
        user,
      });
      const completion = StoryDetailApiActions.newCommentSuccess({
        storyRef,
        projectId,
        comment,
        user,
      });

      actions$ = hot('-a', { a: action });
      const response = cold('-b|', { b: null });
      const expected = cold('--c', { c: completion });

      projectApiService.newComment.mockReturnValue(response);

      expect(effects.newComent$).toBeObservable(expected);
    });

    it('should dispatch newCommentError action on failed new comment', () => {
      const projectApiService = spectator.inject(ProjectApiService);
      const effects = spectator.inject(StoryDetailCommentsEffects);
      const comment = 'Test comment';
      const storyRef = 123;
      const projectId = 'testProject';
      const user = UserMockFactory();
      store.overrideSelector(selectUser, user);

      const action = StoryDetailActions.newComment({
        storyRef,
        projectId,
        comment,
        user,
      });
      const completion = StoryDetailApiActions.newCommentError(action);
      const error = new HttpErrorResponse({});

      actions$ = hot('-a', { a: action });
      const response = cold('-#|', {}, error);
      const expected = cold('--c', { c: completion });

      projectApiService.newComment.mockReturnValue(response);

      expect(effects.newComent$).toBeObservable(expected);
    });
  });

  it('should fetch comments when a createComment event occurs', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(StoryDetailCommentsEffects);

    const story = StoryDetailMockFactory();
    const projectId = 'testProject';
    const storyRef = story.ref;
    const order = 'createdAt';
    const offset = 0;
    const total = 10;
    const comments = Array(total).fill({});

    store.overrideSelector(storyDetailFeature.selectStory, story);
    store.overrideSelector(storyDetailFeature.selectCommentsOrder, order);

    const action = projectEventActions.createComment({
      projectId,
      storyRef,
    });
    const completion = StoryDetailApiActions.fetchCommentsSuccess({
      comments,
      total,
      order,
      offset,
    });

    actions$ = hot('-a', { a: action });
    const response = cold('-b|', { b: { comments, total } });
    const expected = cold('--c', { c: completion });

    projectApiService.getComments.mockReturnValue(response);

    expect(effects.fetchCommentsOnEvent$).toBeObservable(expected);
  });
});
