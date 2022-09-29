/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { KanbanStory } from '~/app/modules/project/feature-kanban/kanban.model';

import { KanbanState } from './kanban.reducer';

export interface DropCandidate {
  position: 'top' | 'bottom';
}

export function findStory(
  state: KanbanState,
  ref: KanbanStory['ref']
): KanbanStory | undefined {
  let story;

  Object.values(state.stories).some((stories) => {
    const statusStory = stories.find((story) => story.ref === ref);

    if (statusStory) {
      story = statusStory;
    }

    return !!statusStory;
  });

  return story;
}

export function addStory(
  state: KanbanState,
  story: KanbanStory,
  status: KanbanStory['status']['slug'],
  target?: KanbanStory,
  position?: DropCandidate['position']
) {
  const targetStory = findStory(state, target?.ref);

  if (targetStory) {
    let index = state.stories[status].findIndex((it) => {
      return it.ref === targetStory.ref;
    });

    if (position === 'bottom') {
      index++;
    }

    state.stories[status].splice(index, 0, story);
  } else {
    state.stories[status].splice(0, 0, story);
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
