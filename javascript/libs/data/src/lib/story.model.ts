/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Status } from './status.model';
import { User } from './user.model';
import { Workflow } from './workflow.model';

export interface Story {
  ref: number;
  version: number;
  title: string;
  description: string | null;
  slug: string;
  status: Pick<Status, 'id' | 'color' | 'name'>;
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
  titleUpdatedAt: string | null;
  titleUpdatedBy: Pick<User, 'username' | 'fullName' | 'color'> | null;
  descriptionUpdatedAt: string | null;
  descriptionUpdatedBy: Pick<User, 'username' | 'fullName' | 'color'> | null;
}

export interface StoryUpdate {
  ref: Story['ref'];
  version: Story['version'];
  status?: Story['status']['id'];
  title?: Story['title'];
  description?: Story['description'];
}

export interface createdBy {
  username: string;
  fullName: string;
  color: number;
}

export type StoryView = 'modal-view' | 'full-view' | 'side-view';
