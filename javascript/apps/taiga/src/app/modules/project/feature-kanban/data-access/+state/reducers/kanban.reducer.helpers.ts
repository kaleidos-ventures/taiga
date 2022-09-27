/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { KanbanStory } from '~/app/modules/project/feature-kanban/kanban.model';
import { DropCandidate } from '~/app/shared/drag/drag.model';
import { KanbanState } from './kanban.reducer';

export function findStory(
  state: KanbanState,
  condition: (story: KanbanStory) => boolean
): KanbanStory | undefined {
  let story;

  Object.values(state.stories).some((stories) => {
    const statusStory = stories.find((story) => condition(story));

    if (statusStory) {
      story = statusStory;
    }

    return !!statusStory;
  });

  return story;
}

export function findStoryIndex(
  state: KanbanState,
  ref: KanbanStory['ref']
): number {
  let storyIndex = -1;

  Object.values(state.stories).some((stories) => {
    const statusStory = stories.findIndex((story) => {
      return story.ref === ref;
    });

    if (statusStory !== -1) {
      storyIndex = statusStory;
    }

    return statusStory !== -1;
  });

  return storyIndex;
}

export function getStory(
  state: KanbanState,
  targetRef: KanbanStory['ref'],
  position: DropCandidate['position']
) {
  const target = findStory(state, (it) => it.ref === targetRef);

  if (target) {
    let index = state.stories[target.status.slug].findIndex((it) => {
      return it.ref === target.ref;
    });

    if (position === 'top') {
      index--;
    } else {
      index++;
    }

    return state.stories[target.status.slug][index];
  }

  return undefined;
}

export function addStory(
  state: KanbanState,
  story: KanbanStory,
  targetRef: KanbanStory['ref'],
  position: DropCandidate['position'],
  status?: KanbanStory['status']['slug']
) {
  const target = findStory(state, (it) => it.ref === targetRef);

  if (target) {
    let index = state.stories[target.status.slug].findIndex((it) => {
      return it.ref === target.ref;
    });

    if (position === 'bottom') {
      index++;
    }

    state.stories[target.status.slug].splice(index, 0, story);
  } else if (status) {
    state.stories[status].push(story);
  }

  return state;
}

export function removeStory(
  state: KanbanState,
  condition: (story: KanbanStory) => boolean
) {
  Object.keys(state.stories).forEach((status) => {
    state.stories[status] = state.stories[status].filter((it) => {
      return !condition(it);
    });
  });

  return state;
}

export function setIntialPosition(state: KanbanState, story: KanbanStory) {
  if (story.ref) {
    const index = findStoryIndex(state, story.ref);

    if (index !== -1) {
      state.initialDragDropPosition[story.ref] = {
        status: story.status.slug,
        index,
      };
    }
  }

  return state;
}
