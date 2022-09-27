/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Status, Story } from '@taiga/data';
import { SetOptional } from 'type-fest';

interface BaseStory extends Story {
  _dragging?: boolean;
  _shadow?: boolean;
}

export interface KanbanStoryA11y {
  ref: null | PartialStory['ref'];
  initialPosition: {
    status: Status['slug'];
    index: null | number;
  };
  prevPosition: {
    status: Status['slug'];
    index: null | number;
  };
  currentPosition: {
    status: Status['slug'];
    index: null | number;
  };
}

export interface PartialStory extends SetOptional<BaseStory, 'ref' | 'slug'> {
  tmpId: string;
}

export type KanbanStory = PartialStory | BaseStory;
