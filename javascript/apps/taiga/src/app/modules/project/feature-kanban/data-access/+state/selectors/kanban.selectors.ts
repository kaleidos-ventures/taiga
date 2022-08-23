/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createSelector } from '@ngrx/store';
import { Status } from '@taiga/data';
import { kanbanFeature } from '../reducers/kanban.reducer';

export const {
  selectLoadingWorkflows,
  selectLoadingTasks,
  selectWorkflows,
  selectTasks,
  selectCreateTaskForm,
  selectScrollToTask,
  selectEmpty,
} = kanbanFeature;

export const selectStatusFormOpen = (statusSlug: Status['slug']) => {
  return createSelector(selectCreateTaskForm, (openForm) => {
    return statusSlug === openForm;
  });
};

export const selectStatusNewTasks = (statusSlug: Status['slug']) => {
  return createSelector(selectScrollToTask, selectTasks, (newTasks, tasks) => {
    const task = tasks[statusSlug].find((task) => {
      if ('tmpId' in task) {
        return newTasks.includes(task.tmpId);
      }

      return false;
    });

    if (task && 'tmpId' in task) {
      return task;
    }

    return null;
  });
};
