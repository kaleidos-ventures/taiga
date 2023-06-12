/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { InjectionToken } from '@angular/core';

export interface EditorImageUpload {
  imageUploadHandler(blobInfo: {
    filename: () => string;
    blob: () => Blob;
  }): Promise<string>;
}

export const EditorImageUploadService = new InjectionToken<EditorImageUpload>(
  'edit-image-upload'
);
