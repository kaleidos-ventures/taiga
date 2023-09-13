/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randAlphaNumeric, randUrl } from '@ngneat/falso';

export const apiUrl = randUrl();

export const social = {
  github: {
    clientId: randAlphaNumeric(),
  },
  gitlab: {
    serverUrl: randUrl(),
    clientId: randAlphaNumeric(),
  },
  google: {
    clientId: randUrl(),
  },
};

export const ConfigServiceMock = {
  apiUrl,
  social,
  correlationId: '11-22',
};
