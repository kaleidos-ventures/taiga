/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

export interface Template {
  nextStep: string;
  icon: string;
  title: string;
  tip?: string;
  description: string;
  action: () => unknown;
}

export type Step =
  | 'init'
  | 'blank'
  | 'invite'
  | 'template'
  | 'import'
  | 'duplicate';
