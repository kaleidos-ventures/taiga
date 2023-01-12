/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Status } from './status.model';
import { User } from './user.model';
import { Workflow } from './workflow.model';

export interface Story {
  ref: number;
  version: number;
  title: string;
  slug: string;
  status: Pick<Status, 'slug' | 'color' | 'name'>;
  assignees: Pick<User, 'username' | 'fullName' | 'color'>[];
}

export interface StoryDetail extends Story {
  workflow: Pick<Workflow, 'name' | 'slug'>;
  prev: null | {
    ref: Story['ref'];
    title: Story['title'];
  };
  next: null | {
    ref: Story['ref'];
    title: Story['title'];
  };
  createdBy: createdBy;
  createdAt: string;
}

export interface StoryUpdate {
  ref: Story['ref'];
  version: Story['version'];
  status?: Story['status']['slug'];
}

export interface createdBy {
  username: string;
  fullName: string;
}

export type StoryView = 'modal-view' | 'full-view' | 'side-view';
