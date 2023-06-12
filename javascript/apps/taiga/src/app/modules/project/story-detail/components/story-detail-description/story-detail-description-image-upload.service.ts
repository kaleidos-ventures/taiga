/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable, inject } from '@angular/core';
import { RxState } from '@rx-angular/state';
import { ProjectApiService } from '@taiga/api';
import { EditorImageUpload } from '~/app/shared/editor/editor-image-upload.service';
import { StoryDetailDescriptionState } from './story-detail-description.component';

@Injectable({
  providedIn: 'root',
})
export class StoryDetailDescriptionImageUploadService
  implements EditorImageUpload
{
  public projectApiService = inject(ProjectApiService);
  public state = inject<RxState<StoryDetailDescriptionState>>(RxState);

  public imageUploadHandler(blobInfo: {
    filename: () => string;
    blob: () => Blob;
  }): Promise<string> {
    const file = new File([blobInfo.blob()], blobInfo.filename());

    return new Promise((resolve) => {
      this.projectApiService
        .uploadStoriesMediafiles(
          this.state.get('projectId'),
          this.state.get('story').ref,
          [file]
        )
        .subscribe((result) => {
          resolve(result[0].file);
        });
    });
  }
}
