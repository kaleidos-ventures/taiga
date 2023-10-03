/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createFeature, createSelector, on } from '@ngrx/store';
import { Status, Story, Workflow } from '@taiga/data';
import { DropCandidate } from '@taiga/ui/drag/drag.model';
import {
  projectEventActions,
  projectApiActions,
} from '~/app/modules/project/data-access/+state/actions/project.actions';
import {
  KanbanStory,
  KanbanStoryA11y,
  PartialStory,
} from '~/app/modules/project/feature-kanban/kanban.model';
import { StoryDetailActions } from '~/app/modules/project/story-detail/data-access/+state/actions/story-detail.actions';
import { moveItemArray } from '~/app/shared/utils/move-item-array';
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
import { StoryDetailApiActions } from '~/app/modules/project/story-detail/data-access/+state/actions/story-detail.actions';

export interface KanbanState {
  loadingWorkflow: boolean;
  loadingStories: boolean;
  workflow: null | Workflow;
  currentWorkflowSlug: Workflow['slug'];
  stories: Record<Status['id'], KanbanStory[]>;
  createStoryForm: Status['id'];
  scrollToStory: PartialStory['tmpId'][];
  empty: boolean | null;
  newEventStories: Story['ref'][];
  permissionsError: boolean;
  initialDragDropPosition: Record<
    Story['ref'],
    {
      status: Status['id'];
      index: number;
    }
  >;
  activeA11yDragDropStory: KanbanStoryA11y;
  dragging: KanbanStory[];
  hasDropCandidate: boolean;
  loadingStatus: boolean;
  draggingStatus: Status | null;
  dragType: 'story' | 'status' | null;
  statusDropCandidate: {
    id: Status['id'];
    candidate?: {
      id: Status['id'];
      position: DropCandidate['hPosition'];
    };
  } | null;
}

export const initialKanbanState: KanbanState = {
  loadingWorkflow: false,
  loadingStories: false,
  workflow: null,
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
  draggingStatus: null,
  hasDropCandidate: false,
  loadingStatus: false,
  dragType: null,
  statusDropCandidate: null,
};

export const reducer = createImmerReducer(
  initialKanbanState,
  on(KanbanActions.initKanban, (state): KanbanState => {
    state = { ...initialKanbanState };

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

    state.stories[story.status.id].push(story);

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
              id: status.id,
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
    KanbanApiActions.fetchWorkflowSuccess,
    (state, { workflow }): KanbanState => {
      state.workflow = workflow;
      state.currentWorkflowSlug = workflow.slug;
      state.loadingWorkflow = false;

      workflow.statuses.forEach((status) => {
        if (!state.stories[status.id]) {
          state.stories[status.id] = [];
        }
      });

      if (state.empty !== null && state.empty) {
        // open the first form if the kanban is empty and there is at least one status
        state.createStoryForm = state.workflow.statuses?.[0]?.id;
      }

      return state;
    }
  ),
  on(
    KanbanApiActions.fetchStoriesSuccess,
    (state, { stories, offset, complete }): KanbanState => {
      stories.forEach((story) => {
        if (!state.stories[story.status.id]) {
          state.stories[story.status.id] = [];
        }

        state.stories[story.status.id].push(story);
      });

      state.loadingStories = !complete;

      if (!offset) {
        state.empty = !stories.length;
      }

      if (state.empty && state.workflow) {
        // open the first form if the kanban is empty and there is at least one status
        state.createStoryForm = state.workflow.statuses?.[0]?.id;
      }

      return state;
    }
  ),
  on(
    KanbanApiActions.createStorySuccess,
    (state, { story, tmpId }): KanbanState => {
      state.stories[story.status.id] = state.stories[story.status.id].map(
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
        state.stories[story.status.id] = state.stories[story.status.id].filter(
          (it) => {
            return !('tmpId' in it && it.tmpId === story.tmpId);
          }
        );
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
    state.stories[story.status.id].push(story);

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
      state.dragType = 'story';

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
        const statusObj = state.workflow?.statuses.find(
          (it) => it.id === status
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
    if (oldStory?.status.id !== story.status && state.workflow) {
      const status = state.workflow.statuses.find(
        (it) => it.id === story.status
      );

      if (oldStory && status && state.stories[status.id]) {
        state = removeStory(state, (it) => it.ref === story.ref);
        state.stories[status.id].push({
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

    if (oldStory?.status.id !== story?.status.id) {
      state = removeStory(state, (it) => it.ref === story.ref);
      if (state.stories[story.status.id]) {
        state.stories[story.status.id].push(story);
      }
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
  }),
  on(KanbanActions.createStatus, (state): KanbanState => {
    state.loadingStatus = true;

    return state;
  }),
  on(
    KanbanApiActions.createStatusSuccess,
    KanbanEventsActions.updateStatus,
    (state, { status }): KanbanState => {
      state.loadingStatus = false;

      state.workflow?.statuses.push(status);
      state.stories[status.id] = [];

      return state;
    }
  ),
  on(
    KanbanActions.editStatus,
    KanbanEventsActions.editStatus,
    (state, { status }): KanbanState => {
      const statusIndex = state.workflow!.statuses.findIndex(
        (it) => it.id === status.id
      );
      state.workflow!.statuses[statusIndex].name = status.name;

      return state;
    }
  ),
  on(
    KanbanApiActions.editStatusError,
    (state, { undo, status }): KanbanState => {
      const statusIndex = state.workflow!.statuses.findIndex(
        (it) => it.id === status.id
      );
      state.workflow!.statuses[statusIndex].name = undo.status.name;

      return state;
    }
  ),
  on(
    KanbanApiActions.deleteStatusSuccess,
    KanbanEventsActions.statusDeleted,
    (state, { status, moveToStatus }): KanbanState => {
      const statuses = state.workflow!.statuses;
      const statusIndex = statuses.findIndex((it) => it.id === status);
      if (moveToStatus) {
        const storiesToMove = state.stories[status];
        state.stories[moveToStatus] = [
          ...state.stories[moveToStatus],
          ...storiesToMove,
        ];
      }
      statuses.splice(statusIndex, 1);
      delete state.stories[status];

      return state;
    }
  ),
  on(KanbanActions.statusDragStart, (state, { id }): KanbanState => {
    const currentWorkflow = state.workflow;

    if (currentWorkflow) {
      state.dragType = 'status';

      state.draggingStatus =
        currentWorkflow.statuses.find((it) => it.id === id) ?? null;
    }

    return state;
  }),
  on(
    KanbanActions.statusDropCandidate,
    (state, { candidate, id }): KanbanState => {
      state.statusDropCandidate = {
        candidate,
        id,
      };

      return state;
    }
  ),
  on(
    KanbanActions.statusDropped,
    projectEventActions.statusReorder,
    (state, { id, candidate }): KanbanState => {
      const currentWorkflow = state.workflow;

      if (!currentWorkflow) {
        return state;
      }
      const currentStatus = currentWorkflow.statuses.find((it) => it.id === id);

      if (candidate && currentStatus) {
        const currentStatusIndex = currentWorkflow.statuses.findIndex(
          (it) => it.id === id
        );

        let statusIndex = currentWorkflow.statuses.findIndex(
          (it) => it.id === candidate.id
        );

        let statusInNextPosition: null | Status = null;

        if (candidate.position === 'right') {
          statusIndex++;

          statusInNextPosition = currentWorkflow.statuses[statusIndex] ?? null;
        } else {
          statusInNextPosition =
            currentWorkflow.statuses[statusIndex - 1] ?? null;
        }

        if (statusIndex > currentStatusIndex) {
          statusIndex--;
        }

        if (!statusInNextPosition || statusInNextPosition.id !== id) {
          currentWorkflow.statuses = moveItemArray(
            currentWorkflow.statuses,
            currentStatusIndex,
            statusIndex
          );
        }
      }

      state.draggingStatus = null;
      state.statusDropCandidate = null;

      return state;
    }
  ),
  on(
    projectApiActions.updateWorkflowSuccess,
    projectEventActions.updateWorkflow,
    (state, { workflow }): KanbanState => {
      if (state.workflow?.id === workflow.id) {
        state.currentWorkflowSlug = workflow.slug;
      }

      if (state.workflow?.id === workflow.id) {
        state.workflow.name = workflow.name;
        state.workflow.slug = workflow.slug;
      }

      return state;
    }
  ),
  on(
    StoryDetailApiActions.fetchWorkflowSuccess,
    (state, { workflow }): KanbanState => {
      if (!state.workflow) {
        state.workflow = workflow;
        state.currentWorkflowSlug = workflow.slug;
      }

      return state;
    }
  )
);

export const kanbanFeature = createFeature({
  name: 'kanban',
  reducer,
  extraSelectors: ({
    selectWorkflow,
    selectDraggingStatus,
    selectStatusDropCandidate,
  }) => ({
    selectColums: createSelector(
      selectWorkflow,
      selectDraggingStatus,
      selectStatusDropCandidate,
      (workflow, currentStatus, statusDropCandidate) => {
        if (!workflow) {
          return [];
        }

        if (!statusDropCandidate) {
          return workflow.statuses.map((it) => {
            return {
              status: it,
              isPlaceholder: it.id === currentStatus?.id,
            };
          });
        }

        let columns: {
          status: Status;
          isPlaceholder: boolean;
        }[] = workflow.statuses.map((it) => {
          return {
            status: it,
            isPlaceholder: false,
          };
        });

        const { candidate, id } = statusDropCandidate;

        if (candidate && currentStatus) {
          let statusIndex = columns.findIndex(
            (it) => it.status.id === candidate.id
          );

          let statusInNextPosition: null | Status = null;

          if (candidate.position === 'right') {
            statusIndex++;

            statusInNextPosition = columns[statusIndex]?.status ?? null;
          } else {
            statusInNextPosition = columns[statusIndex - 1]?.status ?? null;
          }

          if (!statusInNextPosition || statusInNextPosition.id !== id) {
            columns.splice(statusIndex, 0, {
              isPlaceholder: true,
              status: currentStatus,
            });

            columns = columns.filter(
              (it) => it.status.id !== id || it.isPlaceholder
            );
          }
        }

        return columns.map((it) => {
          return {
            ...it,
            isPlaceholder: it.status.id === id,
          };
        });
      }
    ),
  }),
});
