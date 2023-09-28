/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  rand,
  randFullName,
  randNumber,
  randParagraph,
  randPastDate,
  randSlug,
  randText,
  randUser,
  randUuid,
} from '@ngneat/falso';
import { Status, StatusMockFactory, UserMockFactory } from '..';
import { Story, StoryDetail } from './story.model';

export const StoryMockFactory = (
  statuses: Status[] = [
    StatusMockFactory(),
    StatusMockFactory(),
    StatusMockFactory(),
  ]
): Story => {
  let titleCount = Math.floor(Math.random() * 200);

  if (titleCount < 10) {
    titleCount = 10;
  }

  return {
    ref: randNumber({ min: 1, max: 999 }),
    version: randNumber(),
    title: randText({ charCount: titleCount }),
    description: randParagraph(),
    slug: randSlug(),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    assignees: [],
  };
};

export const StoryDetailMockFactory = (
  statuses: Status[] = [
    StatusMockFactory(),
    StatusMockFactory(),
    StatusMockFactory(),
  ]
): StoryDetail => {
  let titleCount = Math.floor(Math.random() * 200);

  if (titleCount < 10) {
    titleCount = 10;
  }

  const user = UserMockFactory();

  return {
    ref: randNumber({ min: 1, max: 999 }),
    version: randNumber(),
    title: randText({ charCount: titleCount }),
    description: randParagraph(),
    slug: randSlug(),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    workflow: {
      id: randUuid(),
      name: randText(),
      slug: randSlug(),
    },
    prev: null,
    next: null,
    createdBy: {
      username: randUser().username,
      fullName: randFullName(),
      color: rand([1, 2, 3, 4, 5, 7, 8]),
    },
    createdAt: randPastDate().toString(),
    assignees: [],
    titleUpdatedAt: randPastDate().toString(),
    titleUpdatedBy: {
      username: user.username,
      fullName: user.fullName,
      color: user.color,
    },
    descriptionUpdatedAt: randPastDate().toString(),
    descriptionUpdatedBy: {
      username: user.username,
      fullName: user.fullName,
      color: user.color,
    },
  };
};
