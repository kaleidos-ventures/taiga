/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { randNumber, randSlug, randText } from '@ngneat/falso';
import { Status } from '..';
import { Task } from './task.model';

export const TaskMockFactory = (
  statuses: Status['slug'][] = ['new', 'in-progress', 'done']
): Task => {
  let titleCount = Math.floor(Math.random() * 200);

  if (titleCount < 10) {
    titleCount = 10;
  }

  return {
    reference: randNumber({ min: 1, max: 999 }),
    name: randText({ charCount: titleCount }),
    order: randNumber(),
    workflow: randSlug(),
    project: randSlug(),
    slug: randSlug(),
    status: statuses[Math.floor(Math.random() * statuses.length)],
  };
};
