/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randPastDate, randUuid } from '@ngneat/falso';
import { NotificationStoryAssign } from './notification.model';
import { ProjectMockFactory } from './project.model.mock';
import { StoryMockFactory } from './story.model.mock';
import { UserMockFactory } from './user.model.mock';

export const NotificationMockFactory = (): NotificationStoryAssign => {
  const createdBy = UserMockFactory();
  const assignedBy = UserMockFactory();
  const assignedTo = UserMockFactory();
  const project = ProjectMockFactory();
  const story = StoryMockFactory();

  return {
    id: randUuid(),
    type: 'stories.assign',
    createdBy: {
      color: createdBy.color,
      username: createdBy.username,
      fullName: createdBy.fullName,
    },
    createdAt: randPastDate().toDateString(),
    readAt: randPastDate().toDateString(),
    content: {
      story: {
        ref: story.ref,
        title: story.title,
      },
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
      },
      assignedBy: {
        color: assignedBy.color,
        username: assignedBy.username,
        fullName: assignedBy.fullName,
      },
      assignedTo: {
        color: assignedTo.color,
        username: assignedTo.username,
        fullName: assignedTo.fullName,
      },
    },
  } as NotificationStoryAssign;
};
