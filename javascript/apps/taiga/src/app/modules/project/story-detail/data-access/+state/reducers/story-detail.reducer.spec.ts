/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  StoryDetailState,
  reducer,
  initialStoryDetailState,
} from './story-detail.reducer';
import {
  StoryDetailActions,
  StoryDetailApiActions,
} from '../actions/story-detail.actions';
import {
  StoryDetailMockFactory,
  UserCommentMockFactory,
  UserMockFactory,
} from '@taiga/data';
import { projectEventActions } from '~/app/modules/project/data-access/+state/actions/project.actions';

describe('Story Detail Reducer', () => {
  let state: StoryDetailState;

  beforeEach(() => {
    state = initialStoryDetailState;
  });

  it('should set loadingComments to true when fetchComments is dispatched', () => {
    const action = StoryDetailApiActions.fetchComments({
      storyRef: 1,
      offset: 0,
      projectId: '1',
      order: 'createdAt',
    });
    const result = reducer(state, action);

    expect(result.loadingComments).toBe(true);
  });

  it('should set loadingComments to false and update the comments when fetchCommentsSuccess is dispatched', () => {
    const comments = [UserCommentMockFactory()];
    const total = 1;
    const offset = 0;
    const action = StoryDetailApiActions.fetchCommentsSuccess({
      comments,
      total,
      offset,
      order: '-createdAt',
    });
    const result = reducer(state, action);

    expect(result.loadingComments).toBe(false);
    expect(result.comments).toEqual(comments);
    expect(result.totalComments).toEqual(total);
  });

  it('should update the comments order when changeOrderComments is dispatched', () => {
    const order = '-createdAt';
    const action = StoryDetailActions.changeOrderComments({
      order,
      storyRef: 1,
      projectId: '1',
    });
    const result = reducer(state, action);

    expect(result.commentsOrder).toEqual(order);
    expect(result.comments).toEqual([]);
  });

  it('should add a new comment when newComment is dispatched', () => {
    const comment = 'Test Comment';
    const user = UserMockFactory();
    const action = StoryDetailActions.newComment({
      comment,
      user,
      storyRef: 1,
      projectId: '1',
    });
    const result = reducer(state, action);

    expect(result.comments.length).toEqual(1);
    expect(result.comments[0].text).toEqual(comment);
    expect(result.totalComments).toEqual(1);
  });

  it('should add a new comment when createComment is dispatched with matching storyRef', () => {
    const comment = UserCommentMockFactory();
    const story = StoryDetailMockFactory();
    const action = projectEventActions.createComment({
      comment,
      storyRef: story.ref,
    });
    const result = reducer({ ...state, story }, action);

    expect(result.comments.length).toEqual(1);
    expect(result.comments[0]).toEqual(comment);
    expect(result.totalComments).toEqual(1);
  });

  it('add a new comment when the pagination do not need more comments', () => {
    const comment = UserCommentMockFactory();
    const story = StoryDetailMockFactory();
    const action = projectEventActions.createComment({
      comment,
      storyRef: story.ref,
    });
    // need to paginate 2 more comments + 1 new comment
    const result = reducer(
      {
        ...state,
        story,
        comments: [UserCommentMockFactory(), UserCommentMockFactory()],
        totalComments: 4,
        commentsOrder: 'createdAt',
      },
      action
    );

    expect(result.comments.length).toEqual(2);
    expect(result.totalComments).toEqual(5);
  });

  it('should not add a new comment when createComment is dispatched with non-matching storyRef', () => {
    const comment = UserCommentMockFactory();
    const storyRef = 2;
    const action = projectEventActions.createComment({ comment, storyRef });
    const result = reducer(state, action);

    expect(result.comments.length).toEqual(0);
    expect(result.totalComments).toBe(null);
  });
});
