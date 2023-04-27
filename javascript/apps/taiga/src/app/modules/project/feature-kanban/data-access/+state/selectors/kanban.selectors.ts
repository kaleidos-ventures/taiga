/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createSelector } from '@ngrx/store';
import { Status } from '@taiga/data';
import { kanbanFeature } from '../reducers/kanban.reducer';
import { findStory } from '../reducers/kanban.reducer.helpers';
import { PartialStory } from '~/app/modules/project/feature-kanban/kanban.model';

export const {
  selectKanbanState,
  selectLoadingWorkflows,
  selectLoadingStories,
  selectWorkflows,
  selectStories,
  selectCreateStoryForm,
  selectScrollToStory,
  selectEmpty,
  selectNewEventStories,
  selectPermissionsError,
  selectActiveA11yDragDropStory,
  selectDragging,
  selectHasDropCandidate,
  selectCurrentWorkflowSlug,
} = kanbanFeature;

export const selectStatusFormOpen = (statusSlug: Status['slug']) => {
  return createSelector(selectCreateStoryForm, (openForm) => {
    return statusSlug === openForm;
  });
};

export const selectStatusNewStories = (statusSlug: Status['slug']) => {
  return createSelector(
    selectScrollToStory,
    selectStories,
    (newStories, stories): null | PartialStory => {
      const story = stories[statusSlug].find((story) => {
        if (story.tmpId) {
          return newStories.includes(story.tmpId);
        }

        return false;
      });

      if (story && 'tmpId' in story) {
        return story as PartialStory;
      }

      return null;
    }
  );
};

export const selectStory = (ref: number) => {
  return createSelector(kanbanFeature.selectKanbanState, (state) => {
    return findStory(state, (it) => it.ref === ref);
  });
};

export const selectCurrentWorkflow = createSelector(
  selectWorkflows,
  selectCurrentWorkflowSlug,
  (wokflows, slug) => {
    return wokflows?.find((it) => it.slug === slug);
  }
);
