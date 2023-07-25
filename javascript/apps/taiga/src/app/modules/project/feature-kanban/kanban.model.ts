/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
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
    status: Status['id'];
    index: null | number;
  };
  prevPosition: {
    status: Status['id'];
    index: null | number;
  };
  currentPosition: {
    status: Status['id'];
    index: null | number;
  };
}

export interface PartialStory
  extends SetOptional<BaseStory, 'ref' | 'slug' | 'version'> {
  tmpId: string;
}

export type KanbanStory = PartialStory | BaseStory;

export interface KanbanReorderEvent {
  reorder: {
    reorder: {
      place: 'before' | 'after';
      ref: Story['ref'];
    } | null;
    status: Status;
    stories: Story['ref'][];
  };
}
