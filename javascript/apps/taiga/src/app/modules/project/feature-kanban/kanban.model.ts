/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { SetOptional } from 'type-fest';
import { Story } from '@taiga/data';

export interface PartialStory
  extends SetOptional<Story, 'reference' | 'slug' | 'project' | 'order'> {
  tmpId: string;
}

export type KanbanStory = PartialStory | Story;
