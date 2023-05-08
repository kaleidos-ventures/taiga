/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createFeature, on } from '@ngrx/store';
import { Status, Story, Workflow } from '@taiga/data';
import { projectEventActions } from '~/app/modules/project/data-access/+state/actions/project.actions';
import {
  KanbanStory,
  KanbanStoryA11y,
  PartialStory,
} from '~/app/modules/project/feature-kanban/kanban.model';
import { StoryDetailActions } from '~/app/modules/project/story-detail/data-access/+state/actions/story-detail.actions';
import { DropCandidate } from '~/app/shared/drag/drag.model';
import { pick } from '~/app/shared/utils/pick';
import { createImmerReducer } from '~/app/shared/utils/store';
import {
  KanbanActions,
  KanbanApiActions,
  KanbanEventsActions,
} from '../actions/kanban.actions';
import {
  addStory,
  findStory,
  getStory,
  removeStory,
  replaceStory,
  setIntialPosition,
} from './kanban.reducer.helpers';

export interface KanbanState {
  loadingWorkflows: boolean;
  loadingStories: boolean;
  workflows: null | Workflow[];
  currentWorkflowSlug: Workflow['slug'];
  stories: Record<Status['slug'], KanbanStory[]>;
  createStoryForm: Status['slug'];
  scrollToStory: PartialStory['tmpId'][];
  empty: boolean | null;
  newEventStories: Story['ref'][];
  permissionsError: boolean;
  initialDragDropPosition: Record<
    Story['ref'],
    {
      status: Status['slug'];
      index: number;
    }
  >;
  activeA11yDragDropStory: KanbanStoryA11y;
  dragging: KanbanStory[];
  hasDropCandidate: boolean;
}

export const initialKanbanState: KanbanState = {
  loadingWorkflows: false,
  loadingStories: false,
  workflows: null,
  currentWorkflowSlug: 'main',
  stories: {},
  createStoryForm: '',
  scrollToStory: [],
  empty: null,
  newEventStories: [],
  permissionsError: false,
  initialDragDropPosition: {},
  activeA11yDragDropStory: {
    ref: null,
    initialPosition: {
      index: null,
      status: '',
    },
    prevPosition: {
      index: null,
      status: '',
    },
    currentPosition: {
      index: null,
      status: '',
    },
  },
  dragging: [],
  hasDropCandidate: false,
};

export const reducer = createImmerReducer(
  initialKanbanState,
  on(KanbanActions.initKanban, (state): KanbanState => {
    state.workflows = null;
    state.stories = {};
    state.loadingWorkflows = true;
    state.loadingStories = true;
    state.scrollToStory = [];
    state.createStoryForm = '';
    state.empty = null;
    state.activeA11yDragDropStory = {
      ref: null,
      initialPosition: {
        index: null,
        status: '',
      },
      prevPosition: {
        index: null,
        status: '',
      },
      currentPosition: {
        index: null,
        status: '',
      },
    };

    return state;
  }),
  on(KanbanActions.openCreateStoryForm, (state, { status }): KanbanState => {
    state.createStoryForm = status;

    return state;
  }),
  on(KanbanActions.closeCreateStoryForm, (state): KanbanState => {
    state.createStoryForm = '';

    return state;
  }),
  on(KanbanActions.createStory, (state, { story }): KanbanState => {
    if (!state.loadingStories && 'tmpId' in story) {
      state.scrollToStory.push(story.tmpId);
    }

    state.stories[story.status.slug].push(story);

    return state;
  }),
  on(KanbanActions.dragStoryA11y, (state, { story }): KanbanState => {
    state.activeA11yDragDropStory = story;

    if (story.ref && story.initialPosition.index) {
      state.initialDragDropPosition[story.ref] = {
        index: story.initialPosition.index,
        status: story.initialPosition.status,
      };
    }

    return state;
  }),
  on(KanbanActions.moveStoryA11y, (state, { story, status }): KanbanState => {
    if (story.ref) {
      const storyToMove = findStory(state, (it) => it.ref === story.ref);
      if (storyToMove) {
        state = removeStory(state, (it) => it.ref === storyToMove?.ref);

        const recipientStory: {
          story?: KanbanStory;
          position: 'top' | 'bottom';
        } = {
          story: state.stories[story.currentPosition?.status].at(
            story.currentPosition.index!
          ),
          position: 'top',
        };

        const isLastStory =
          story.currentPosition.index! >
          state.stories[story.currentPosition?.status].length - 1;

        if (isLastStory) {
          recipientStory.story =
            state.stories[story.currentPosition?.status].at(-1);
          recipientStory.position = 'bottom';
        }

        storyToMove.status = status;

        state = addStory(
          state,
          storyToMove,
          recipientStory.story?.ref,
          recipientStory.position,
          status
        );
      }
    }

    state.activeA11yDragDropStory = {
      ref: story.ref,
      initialPosition: {
        index: story.initialPosition.index,
        status: story.initialPosition.status,
      },
      prevPosition: {
        index: story.prevPosition.index,
        status: story.prevPosition.status,
      },
      currentPosition: {
        index: story.currentPosition.index,
        status: story.currentPosition.status,
      },
    };

    return state;
  }),
  on(KanbanActions.dropStoryA11y, (state): KanbanState => {
    state.activeA11yDragDropStory = {
      ref: null,
      initialPosition: {
        index: null,
        status: '',
      },
      prevPosition: {
        index: null,
        status: '',
      },
      currentPosition: {
        index: null,
        status: '',
      },
    };

    return state;
  }),
  on(
    KanbanActions.cancelDragStoryA11y,
    (state, { story, status }): KanbanState => {
      if (story.ref) {
        const storyToMove = findStory(state, (it) => it.ref === story.ref);
        if (storyToMove) {
          state = removeStory(state, (it) => it.ref === storyToMove?.ref);
          const nextStory: KanbanStory | undefined = state.stories[
            story.initialPosition?.status
          ].at(story.initialPosition.index!);

          storyToMove.status = status;

          const addPositionData = {
            state,
            storyToMove,
            status: {
              slug: status.slug,
              name: status.name,
              color: status.color,
            },
            nextStory:
              nextStory?.ref ||
              state.stories[story.initialPosition?.status].at(-1)?.ref ||
              0,
            position: nextStory ? 'top' : 'bottom',
          };

          state = addStory(
            addPositionData.state,
            addPositionData.storyToMove,
            addPositionData.nextStory,
            addPositionData.position as DropCandidate['position'],
            addPositionData.status
          );
        }
      }

      state.activeA11yDragDropStory = {
        ref: null,
        initialPosition: {
          index: null,
          status: '',
        },
        prevPosition: {
          index: null,
          status: '',
        },
        currentPosition: {
          index: null,
          status: '',
        },
      };

      return state;
    }
  ),
  on(
    KanbanApiActions.fetchWorkflowsSuccess,
    (state, { workflows }): KanbanState => {
      state.workflows = workflows;
      state.loadingWorkflows = false;

      workflows.forEach((workflow) => {
        workflow.statuses.forEach((status) => {
          if (!state.stories[status.slug]) {
            state.stories[status.slug] = [];
          }
        });
      });

      if (state.empty !== null && state.empty) {
        // open the first form if the kanban is empty
        state.createStoryForm = state.workflows[0].statuses[0].slug;
      }

      return state;
    }
  ),
  on(
    KanbanApiActions.fetchStoriesSuccess,
    (state, { stories, offset, complete }): KanbanState => {
      stories.forEach((story) => {
        if (!state.stories[story.status.slug]) {
          state.stories[story.status.slug] = [];
        }

        state.stories[story.status.slug].push(story);
      });

      state.loadingStories = !complete;

      if (!offset) {
        state.empty = !stories.length;
      }

      if (state.empty && state.workflows) {
        // open the first form if the kanban is empty
        state.createStoryForm = state.workflows[0].statuses[0].slug;
      }

      return state;
    }
  ),
  on(
    KanbanApiActions.createStorySuccess,
    (state, { story, tmpId }): KanbanState => {
      state.stories[story.status.slug] = state.stories[story.status.slug].map(
        (it) => {
          if ('tmpId' in it) {
            return it.tmpId === tmpId ? story : it;
          }

          return it;
        }
      );

      return state;
    }
  ),
  on(
    KanbanApiActions.createStoryError,
    (state, { status, story }): KanbanState => {
      if ('tmpId' in story) {
        state.stories[story.status.slug] = state.stories[
          story.status.slug
        ].filter((it) => {
          return !('tmpId' in it && it.tmpId === story.tmpId);
        });
      }

      if (status === 403) {
        state.permissionsError = true;
      }

      return state;
    }
  ),
  on(KanbanActions.scrolledToNewStory, (state, { tmpId }): KanbanState => {
    state.scrollToStory = state.scrollToStory.filter((it) => it !== tmpId);

    return state;
  }),
  on(KanbanEventsActions.newStory, (state, { story }): KanbanState => {
    state.stories[story.status.slug].push(story);

    state.newEventStories.push(story.ref);

    return state;
  }),
  on(
    KanbanActions.timeoutAnimationEventNewStory,
    (state, { ref }): KanbanState => {
      state.newEventStories = state.newEventStories.filter((it) => {
        return it !== ref;
      });

      return state;
    }
  ),
  on(KanbanActions.storyDragStart, (state, { ref }): KanbanState => {
    const story = findStory(state, (it) => it.ref === ref);

    if (story) {
      state.dragging.push(story);
      story._dragging = true;

      if (story.ref) {
        state = setIntialPosition(state, story);
      }
    }

    return state;
  }),
  on(
    KanbanActions.storyDropCandidate,
    (state, { ref, candidate, status }): KanbanState => {
      const story = findStory(state, (it) => it.ref === ref);

      state = removeStory(state, (it) => !!it._shadow);

      if (story) {
        const copyStory: KanbanStory = {
          ...story,
          _shadow: true,
        };

        if (candidate) {
          const storyInCandatePositon = getStory(
            state,
            candidate.ref,
            candidate.position
          );

          if (ref === storyInCandatePositon?.ref) {
            state.hasDropCandidate = false;
          } else {
            state = addStory(
              state,
              copyStory,
              candidate.ref,
              candidate.position
            );
            state.hasDropCandidate = true;
          }
        } else if (status && !state.stories[status].length) {
          state.stories[status].push(copyStory);
          state.hasDropCandidate = true;
        } else {
          state.hasDropCandidate = false;
        }
      }

      return state;
    }
  ),
  on(
    KanbanActions.storyDropped,
    (state, { ref, candidate, status }): KanbanState => {
      const story = findStory(state, (it) => it.ref === ref && !it._shadow);

      if (story) {
        story._dragging = false;
        story._shadow = false;
      }

      state.dragging = [];
      state.hasDropCandidate = false;

      state = removeStory(state, (it) => !!it._shadow || !!it._dragging);

      if (story) {
        // TODO: current workflow
        const statusObj = state.workflows![0].statuses.find(
          (it) => it.slug === status
        );

        if (statusObj) {
          story.status = statusObj;
        }

        if (candidate) {
          state = removeStory(state, (it) => it.ref === ref);
          state = addStory(state, story, candidate.ref, candidate.position);
        } else if (status && !state.stories[status].length) {
          state = removeStory(state, (it) => it.ref === ref);
          state.stories[status].push(story);
        }
      }

      return state;
    }
  ),
  on(KanbanApiActions.moveStoryError, (state, { story }): KanbanState => {
    const initialDragDropPosition = state.initialDragDropPosition[story];

    if (initialDragDropPosition) {
      const draggedStory = findStory(state, (it) => it.ref === story);

      if (draggedStory) {
        state = removeStory(state, (it) => it.ref === story);

        state.stories[initialDragDropPosition.status].splice(
          initialDragDropPosition.index,
          0,
          draggedStory
        );

        delete state.initialDragDropPosition[story];
      }
    }

    return state;
  }),
  on(KanbanApiActions.moveStorySuccess, (state, { reorder }): KanbanState => {
    reorder.stories.forEach((story) => {
      delete state.initialDragDropPosition[story];
    });

    return state;
  }),
  on(KanbanEventsActions.reorderStory, (state, action): KanbanState => {
    const stories = action.stories.map((story) => {
      return findStory(state, (it) => it.ref === story);
    });

    state = removeStory(state, (it) => {
      if (it.ref) {
        return action.stories.includes(it.ref);
      }

      return false;
    });

    stories.forEach((story) => {
      if (story) {
        story.status = action.status;

        if (action.reorder) {
          state = addStory(
            state,
            story,
            action.reorder.ref,
            action.reorder.place === 'before' ? 'top' : 'bottom'
          );
        } else {
          state = addStory(state, story, undefined, 'top', action.status);
        }
      }
    });

    return state;
  }),
  on(StoryDetailActions.updateStory, (state, { story }): KanbanState => {
    const oldStory = findStory(state, (it) => it.ref === story.ref);

    // TODO: current workflow
    if (oldStory?.status.slug !== story.status && state.workflows) {
      const status = state.workflows[0].statuses.find(
        (it) => it.slug === story.status
      );

      if (oldStory && status && state.stories[status.slug]) {
        state = removeStory(state, (it) => it.ref === story.ref);
        state.stories[status.slug].push({
          ...oldStory,
          ...story,
          status,
        });
      }
    }

    state = replaceStory(state, (it) => {
      if (it.ref === story.ref && story.title) {
        return {
          ...it,
          ...pick(story, ['title']),
        };
      }

      return it;
    });

    return state;
  }),
  on(projectEventActions.updateStory, (state, { story }): KanbanState => {
    const oldStory = findStory(state, (it) => it.ref === story.ref);

    if (oldStory?.status.slug !== story?.status.slug) {
      state = removeStory(state, (it) => it.ref === story.ref);
      state.stories[story.status.slug].push(story);
    } else {
      state = replaceStory(state, (it) => {
        if (it.ref === story.ref) {
          return {
            ...it,
            ...story,
          };
        }

        return it;
      });
    }

    return state;
  }),
  on(
    KanbanActions.assignMember,
    StoryDetailActions.assignMember,
    projectEventActions.assignedMemberEvent,
    (state, { member, storyRef }): KanbanState => {
      state = replaceStory(state, (it) => {
        const unassigned = !it.assignees.find(
          (assignee) => assignee.username === member.username
        );
        if (it.ref === storyRef && unassigned) {
          return {
            ...it,
            assignees: [member, ...it.assignees],
          };
        }
        return it;
      });

      return state;
    }
  ),
  on(
    KanbanActions.unAssignMember,
    StoryDetailActions.unAssignMember,
    projectEventActions.unassignedMemberEvent,
    (state, { member, storyRef }): KanbanState => {
      state = replaceStory(state, (it) => {
        if (it.ref === storyRef) {
          return {
            ...it,
            assignees: it.assignees.filter(
              (storyUser) => storyUser.username !== member.username
            ),
          };
        }

        return it;
      });

      return state;
    }
  ),
  on(
    KanbanActions.deleteStory,
    StoryDetailActions.deleteStory,
    (state, { ref }): KanbanState => {
      state = removeStory(state, (it) => it.ref === ref);

      return state;
    }
  ),
  on(projectEventActions.removeMember, (state, { membership }): KanbanState => {
    state = replaceStory(state, (it) => {
      return {
        ...it,
        assignees: it.assignees.filter(
          (storyUser) => storyUser.username !== membership.user.username
        ),
      };
    });

    return state;
  }),
  on(KanbanActions.removeMembers, (state, { members }): KanbanState => {
    members.map((member) => {
      state = replaceStory(state, (it) => {
        return {
          ...it,
          assignees: it.assignees.filter(
            (storyUser) => storyUser.username !== member.user.username
          ),
        };
      });
    });

    return state;
  })
);

export const kanbanFeature = createFeature({
  name: 'kanban',
  reducer,
});
