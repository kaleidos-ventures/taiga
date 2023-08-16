/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

export interface Attachment {
  name: string;
  size: number;
  createdAt: string;
  contentType: string;
  file: string;
}

export interface LoadingAttachment {
  progress: number;
  file: string;
  contentType: string;
  name: string;
}
