/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createFeature, on } from '@ngrx/store';
import { StoryDetail, StoryView, UserComment, Workflow } from '@taiga/data';
import { projectEventActions } from '~/app/modules/project/data-access/+state/actions/project.actions';
import {
  KanbanActions,
  KanbanApiActions,
  KanbanEventsActions,
} from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { createImmerReducer } from '~/app/shared/utils/store';

import { OrderComments } from '~/app/shared/comments/comments.component';
import {
  StoryDetailActions,
  StoryDetailApiActions,
} from '../actions/story-detail.actions';

export interface StoryDetailState {
  story: StoryDetail | null;
  workflow: Workflow | null;
  loadingStory: boolean;
  loadingWorkflow: boolean;
  storyView: StoryView;
  comments: UserComment[];
  loadingComments: boolean;
  totalComments: number | null;
  commentsOrder: OrderComments;
}

export const initialStoryDetailState: StoryDetailState = {
  story: null,
  workflow: null,
  loadingStory: false,
  loadingWorkflow: false,
  storyView: LocalStorageService.get('story_view') || 'modal-view',
  comments: [],
  loadingComments: false,
  totalComments: null,
  commentsOrder: LocalStorageService.get('comments_order') || '-createdAt',
};

export const reducer = createImmerReducer(
  initialStoryDetailState,
  on(StoryDetailActions.initStory, (state): StoryDetailState => {
    state.loadingStory = true;
    state.loadingWorkflow = true;
    state.story = null;
    state.comments = [];
    state.loadingComments = false;
    state.commentsOrder =
      LocalStorageService.get('comments_order') || '-createdAt';

    return state;
  }),
  on(
    StoryDetailApiActions.fetchStorySuccess,
    (state, { story }): StoryDetailState => {
      state.loadingStory = false;
      state.story = story;

      return state;
    }
  ),
  on(
    StoryDetailApiActions.fetchWorkflowSuccess,
    (state, { workflow }): StoryDetailState => {
      state.loadingWorkflow = false;
      state.workflow = workflow;

      return state;
    }
  ),
  on(
    KanbanApiActions.createStatusSuccess,
    KanbanEventsActions.updateStatus,
    (state, { status, workflow }): StoryDetailState => {
      if (workflow === state.workflow?.slug) {
        state.workflow?.statuses.push(status);
      }

      return state;
    }
  ),
  on(
    KanbanApiActions.deleteStatusSuccess,
    KanbanEventsActions.statusDeleted,
    (state, { status, workflow, moveToStatus }): StoryDetailState => {
      if (workflow === state.workflow?.slug) {
        const statusIndex = state.workflow?.statuses.findIndex(
          (it) => it.id === status
        );
        state.workflow.statuses.splice(statusIndex, 1);
      }

      if (state.story?.status.id === status) {
        const newStatus = state.workflow?.statuses.find(
          (it) => it.id === moveToStatus
        );
        state.story.status = newStatus ?? state.story.status;
      }

      return state;
    }
  ),
  on(
    KanbanApiActions.editStatusSuccess,
    KanbanEventsActions.editStatus,
    (state, { status, workflow }): StoryDetailState => {
      if (workflow === state.workflow?.slug) {
        // Update name from the status dropdown list
        const statusIndex = state.workflow?.statuses.findIndex(
          (it) => it.id === status.id
        );

        state.workflow.statuses[statusIndex].name = status.name;

        // Update current selected status if necessary

        if (status.id === state.story?.status.id) {
          state.story.status.name = status.name;
        }
      }

      return state;
    }
  ),
  on(StoryDetailActions.leaveStoryDetail, (state): StoryDetailState => {
    state.story = null;
    return state;
  }),
  on(
    StoryDetailActions.updateStoryViewMode,
    (state, { storyView }): StoryDetailState => {
      state.storyView = storyView;
      return state;
    }
  ),
  on(
    StoryDetailApiActions.updateStorySuccess,
    (state, { story }): StoryDetailState => {
      state.story = story;

      return state;
    }
  ),
  on(StoryDetailActions.updateStory, (state, { story }): StoryDetailState => {
    if (state.story) {
      if (story.title) {
        state.story.title = story.title;
      }

      if (story.description) {
        state.story.description = story.description;
      }
    }

    return state;
  }),
  on(projectEventActions.updateStory, (state, { story }): StoryDetailState => {
    if (story.ref === state.story?.ref) {
      state.story = story;
    }

    return state;
  }),
  on(
    KanbanApiActions.moveStorySuccess,
    (state, { reorder }): StoryDetailState => {
      if (state.story && reorder.stories.includes(state.story.ref)) {
        state.story.status = reorder.status;
      }

      return state;
    }
  ),
  on(
    StoryDetailActions.assignMember,
    KanbanActions.assignMember,
    projectEventActions.assignedMemberEvent,

    (state, { storyRef, member }): StoryDetailState => {
      if (state.story?.ref === storyRef) {
        state.story?.assignees.unshift(member);
      }
      return state;
    }
  ),
  on(
    StoryDetailActions.unAssignMember,
    KanbanActions.unAssignMember,
    projectEventActions.unassignedMemberEvent,
    (state, { storyRef, member }): StoryDetailState => {
      if (state.story?.ref === storyRef) {
        state.story.assignees = state.story.assignees.filter((storyUser) => {
          return storyUser.username !== member.username;
        });
      }
      return state;
    }
  ),
  on(
    StoryDetailActions.unassignMembers,
    (state, { storyRef, members }): StoryDetailState => {
      if (state.story?.ref === storyRef) {
        state.story.assignees = state.story.assignees.filter((assignee) => {
          return !members.some(
            (member) => member.user.fullName === assignee.fullName
          );
        });
      }
      return state;
    }
  ),
  on(
    projectEventActions.removeMember,
    (state, { membership }): StoryDetailState => {
      if (state.story) {
        state.story.assignees = state.story?.assignees.filter(
          (storyUser) => storyUser.username !== membership.user.username
        );
      }

      return state;
    }
  ),
  on(
    StoryDetailApiActions.deleteStorySuccess,
    (state, { ref }): StoryDetailState => {
      if (state.story?.ref === ref) {
        state.story = null;
      }

      return state;
    }
  ),
  on(StoryDetailApiActions.fetchComments, (state): StoryDetailState => {
    state.loadingComments = true;

    return state;
  }),
  on(
    StoryDetailApiActions.fetchCommentsSuccess,
    (state, { comments, total, offset }): StoryDetailState => {
      if (offset) {
        state.comments = [...state.comments, ...comments];
      } else {
        state.comments = comments;
      }
      state.loadingComments = false;
      state.totalComments = total;

      return state;
    }
  ),
  on(
    StoryDetailActions.changeOrderComments,
    (state, { order }): StoryDetailState => {
      state.commentsOrder = order;
      state.comments = [];

      return state;
    }
  ),
  on(
    StoryDetailActions.newComment,
    (state, { comment, user, tmpId }): StoryDetailState => {
      const newComment: UserComment = {
        id: tmpId,
        createdAt: new Date().toISOString(),
        createdBy: {
          fullName: user.fullName,
          color: user.color,
          username: user.username,
        },
        text: comment,
      };

      if (state.commentsOrder === '-createdAt') {
        state.comments.unshift(newComment);
      } else {
        state.comments.push(newComment);
      }

      if (state.totalComments) {
        state.totalComments++;
      } else {
        state.totalComments = 1;
      }

      return state;
    }
  ),
  on(
    StoryDetailApiActions.newCommentSuccess,
    (state, { comment, tmpId }): StoryDetailState => {
      state.comments = state.comments.map((it) => {
        if (it.id === tmpId) {
          return comment;
        }

        return it;
      });

      return state;
    }
  ),
  on(
    projectEventActions.createComment,
    (state, { comment, storyRef }): StoryDetailState => {
      if (state.story?.ref !== storyRef) {
        return state;
      }

      if (state.commentsOrder === '-createdAt') {
        state.comments.unshift(comment);
      } else if (state.totalComments === state.comments.length) {
        state.comments.push(comment);
      }

      if (state.totalComments) {
        state.totalComments++;
      } else {
        state.totalComments = 1;
      }

      return state;
    }
  ),
  on(
    StoryDetailApiActions.editCommentSuccess,
    projectEventActions.editComment,
    (state, action): StoryDetailState => {
      state.comments = state.comments.map((comment) =>
        comment.id === action.comment.id
          ? {
              ...comment,
              text: action.comment.text,
              modifiedAt: action.comment.modifiedAt,
            }
          : comment
      );

      return state;
    }
  ),
  on(
    StoryDetailApiActions.deleteCommentSuccess,
    (state, { commentId, deletedBy, deletedAt }): StoryDetailState => {
      state.comments = state.comments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              deletedBy,
              deletedAt: deletedAt || new Date().toISOString(),
            }
          : comment
      );

      if (state.totalComments) {
        state.totalComments = state.totalComments - 1;
      }

      return state;
    }
  ),
  on(
    StoryDetailActions.newStatusOrderAfterDrag,
    (state, { workflow }): StoryDetailState => {
      state.workflow = workflow;

      return state;
    }
  )
);

export const storyDetailFeature = createFeature({
  name: 'storyDetail',
  reducer,
});
