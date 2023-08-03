/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ShortcutTask } from './shortcut-task.model';

export default [
  {
    task: 'modal.close',
    defaultKey: 'esc',
    scope: 'modal',
  },
  {
    task: 'side-view.close',
    defaultKey: 'esc',
    scope: 'side-view',
  },
  {
    task: 'assign-user.close',
    defaultKey: 'esc',
    scope: 'assign-user',
  },
  {
    task: 'remove-user.close',
    defaultKey: 'esc',
    scope: 'remove-user',
  },
  {
    task: 'edit-field.close',
    defaultKey: 'esc',
    scope: 'edit-field',
  },
  {
    task: 'conflict.close',
    defaultKey: 'esc',
    scope: 'conflict',
  },
  {
    task: 'cancel',
    defaultKey: 'esc',
  },
] as ShortcutTask[];
