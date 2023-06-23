/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { DragHandleDirective } from './directives/drag-handle.directive';

export interface DropCandidate<T = unknown> {
  position: 'top' | 'bottom';
  hPosition: 'left' | 'right';
  result: T;
}

export type DroppedEvent<T = unknown, U = unknown> =
  | {
      source: T[];
      dropZone: U;
      dropCategory?: string;
      candidate?: DropCandidate<T>;
    }
  | undefined;

export type OverEvent<T = unknown, U = unknown> =
  | {
      source: T[];
      dropZone: U;
      over?: DropCandidate<T>;
      dropCategory?: string;
    }
  | undefined;

export interface DropZone {
  id: unknown;
  nativeElement: HTMLElement;
  overlapStrategy: 'all' | 'horizontal';
  dropCategory?: string;
  removeCandidate: (candidate: Draggable) => void;
  addCandidate: (candidate: Draggable) => void;
  getCandidates: () => Draggable[];
}

export interface Draggable {
  id: unknown;
  nativeElement: HTMLElement;
  dragData: unknown;
  dropZone: DropZone;
  dragDisabled: boolean;
  dropCategory?: string;
  dragByHandle: () => void;
  registerDragHandle: (handle: DragHandleDirective) => void;
}
