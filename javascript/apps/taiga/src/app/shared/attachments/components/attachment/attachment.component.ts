/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { TranslocoModule } from '@ngneat/transloco';
import { TuiButtonModule, TuiSvgModule } from '@taiga-ui/core';
import { Attachment, LoadingAttachment } from '@taiga/data';
import { DynamicTableModule } from '@taiga/ui/dynamic-table/dynamic-table.module';
import { ProgressBarComponent } from '@taiga/ui/progress-bar';
import { ToolTipModule } from '@taiga/ui/tooltip';
import { DateDistancePipe } from '~/app/shared/pipes/date-distance/date-distance.pipe';
import { TransformSizePipe } from '~/app/shared/pipes/transform-size/transform-size.pipe';
import { RealTimeDateDistanceComponent } from '~/app/shared/real-time-date-distance/real-time-date-distance.component';
@Component({
  selector: 'tg-attachment',
  standalone: true,
  imports: [
    CommonModule,
    DynamicTableModule,
    TuiButtonModule,
    ToolTipModule,
    TranslocoModule,
    TransformSizePipe,
    DateDistancePipe,
    TuiSvgModule,
    ProgressBarComponent,
    RealTimeDateDistanceComponent,
  ],
  templateUrl: './attachment.component.html',
  styleUrls: ['./attachment.component.css'],
})
export class AttachmentComponent implements OnChanges {
  @Input({ required: true })
  public attachment!: Attachment | LoadingAttachment;

  @Input()
  public canEdit = true;

  public extension = 'paperclip';

  public calculateExtension() {
    if (this.attachment.contentType.startsWith('image')) {
      this.extension = 'img';
      return;
    } else if (
      this.attachment.contentType.startsWith('video') ||
      this.attachment.contentType.startsWith('audio')
    ) {
      this.extension = 'video';
      return;
    }

    const extension = this.attachment.name.split('.').pop();

    if (!extension) {
      this.extension = 'paperclip';
      return;
    }

    const matchExtension = [
      {
        type: 'pdf',
        extensions: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'txt'],
      },
      {
        type: 'zip',
        extensions: ['zip', 'rar', 'gz', 'tar', '7z', 'tgz'],
      },
    ];

    const match = matchExtension.find((item) =>
      item.extensions.includes(extension)
    );

    if (match) {
      this.extension = match.type;
    } else {
      this.extension = 'paperclip';
    }
  }

  public isLoadingAttachments = (
    attachment: Attachment | LoadingAttachment
  ): attachment is LoadingAttachment => {
    return 'progress' in attachment;
  };

  public ngOnChanges() {
    this.calculateExtension();
  }
}
