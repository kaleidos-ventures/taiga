/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

export interface Milestone {
  closed: boolean;
  closedPoints: null | number;
  createdDate: string;
  disponibility: number;
  estimatedFinish: string;
  estimatedStart: string;
  id: number;
  modifiedDate: string;
  name: string;
  order: number;
  // owner: User['id'];
  // project: Project['id'];
  projectExtraInfo: unknown;
  slug: string;
  totalPoints: number;
}
