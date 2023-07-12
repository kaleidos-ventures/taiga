/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randCatchPhrase } from '@ngneat/falso';
import {
  StatusMockFactory,
  StoryDetailMockFactory,
  UserComment,
  UserCommentMockFactory,
  UserMockFactory,
  WorkflowMockFactory,
} from '@taiga/data';
import { projectEventActions } from '~/app/modules/project/data-access/+state/actions/project.actions';
import { KanbanEventsActions } from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import {
  StoryDetailActions,
  StoryDetailApiActions,
} from '../actions/story-detail.actions';
import {
  StoryDetailState,
  initialStoryDetailState,
  reducer,
} from './story-detail.reducer';

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
      tmpId: '123',
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

  it('should edit a comment when editCommentSuccess is dispatched', () => {
    const id = '123';
    const text = randCatchPhrase();
    const comment: UserComment = {
      ...UserCommentMockFactory(),
      id,
    };
    const comments = [comment];

    const editcomment: UserComment = {
      ...UserCommentMockFactory(),
      id,
      text,
    };
    // const user = UserMockFactory();
    const action = StoryDetailApiActions.editCommentSuccess({
      comment: editcomment,
    });
    const result = reducer(
      {
        ...state,
        comments,
      },
      action
    );

    expect(result.comments.length).toEqual(1);
    expect(result.comments[0].text).toEqual(editcomment.text);
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

  it('should update the statuses when one status is deleted', () => {
    const status = StatusMockFactory();
    const status2 = StatusMockFactory();
    const workflow = WorkflowMockFactory();
    workflow.statuses = [status, status2];
    const story = StoryDetailMockFactory([status]);
    const action = KanbanEventsActions.statusDeleted({
      status: status.slug,
      workflow: workflow.slug,
      moveToStatus: status2.slug,
    });
    const result = reducer(
      {
        ...state,
        story,
        workflow,
      },
      action
    );

    expect(result.workflow!.statuses.length).toEqual(1);
    expect(result.story!.status.slug).toEqual(status2.slug);
  });

  it('should update the comments when one comment is deleted', () => {
    const user = UserMockFactory();
    const comment = UserCommentMockFactory();
    const comment2 = UserCommentMockFactory();
    const comments = [comment, comment2];
    const totalComments = 2;

    const action = StoryDetailApiActions.deleteCommentSuccess({
      commentId: comment.id,
      deletedBy: user,
    });

    const result = reducer(
      {
        ...state,
        comments,
        totalComments,
      },
      action
    );

    expect(result.comments.length).toEqual(2);
    expect(result.totalComments).toEqual(totalComments - 1);
    expect(result.comments[0].deletedBy).toEqual(user);
  });
});
