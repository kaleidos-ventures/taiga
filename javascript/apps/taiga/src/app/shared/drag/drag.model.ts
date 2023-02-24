/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

export interface DropCandidate {
  position: 'top' | 'bottom';
  result: unknown;
}

export type DroppedEvent =
  | {
      source: unknown[];
      dropZone: unknown;
      candidate?: DropCandidate;
    }
  | undefined;

export type OverEvent =
  | {
      source: unknown[];
      dropZone: unknown;
      over?: DropCandidate;
    }
  | undefined;
