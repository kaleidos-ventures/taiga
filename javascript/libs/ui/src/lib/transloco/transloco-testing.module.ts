/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  TranslocoTestingModule,
  TranslocoTestingOptions,
} from '@ngneat/transloco';

export function getTranslocoModule(options: TranslocoTestingOptions = {}) {
  return TranslocoTestingModule.forRoot({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    langs: {
      en: {},
    },
    translocoConfig: {
      availableLangs: ['en-US'],
      defaultLang: 'en-US',
    },
    preloadLangs: true,
    ...options,
  });
}
