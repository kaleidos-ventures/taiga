/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  randFileExt,
  randFileName,
  randNumber,
  randPastDate,
  randUrl,
  randUuid,
} from '@ngneat/falso';
import { Attachment } from './attachment.model';

export const AttachmentMockFactory = (
  params?: Partial<Attachment>
): Attachment => {
  return {
    id: randUuid(),
    name: randFileName(),
    size: randNumber({ min: 1, max: 9000000 }),
    file: randUrl(),
    contentType: randFileExt(),
    createdAt: randPastDate().toISOString(),
    ...params,
  };
};
