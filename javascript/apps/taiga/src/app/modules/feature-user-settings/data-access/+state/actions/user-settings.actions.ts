/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Language } from '@taiga/data';

export const userSettingsActions = createActionGroup({
  source: 'UserSettings',
  events: {
    'Init Preferences': emptyProps(),
    'New Language': props<{
      lang: Language;
    }>(),
  },
});

export const userSettingsApiActions = createActionGroup({
  source: 'UserSettings Api',
  events: {
    'Fetch Languages Success': props<{
      languages: Language[];
    }>(),
    'Update User Language Success': props<{
      lang: Language['code'];
    }>(),
    'Update User Language Error': props<{
      lang: Language['code'];
    }>(),
  },
});
