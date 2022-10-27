/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Status } from './status.model';
import { Workflow } from './workflow.model';

export interface Story {
  ref: number;
  title: string;
  slug: string;
  status: Pick<Status, 'slug' | 'color' | 'name'>;
}

export interface StoryDetail extends Partial<Story> {
  workflow: Partial<Workflow>;
  prev: number | null;
  next: number | null;
}

export type StoryView = 'modal-view' | 'full-view' | 'side-view';
