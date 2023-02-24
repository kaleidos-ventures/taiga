/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createActionGroup, props } from '@ngrx/store';
import { Language } from '@taiga/data';

export const coreActions = createActionGroup({
  source: 'Core',
  events: {
    'Global loading': props<{ loading: boolean }>(),
    'Set Languages': props<{ languages: Language[] }>(),
  },
});
