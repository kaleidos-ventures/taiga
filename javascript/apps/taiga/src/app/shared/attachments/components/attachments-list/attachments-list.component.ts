/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@ngneat/transloco';
import { AttachmentsState } from '~/app/shared/attachments/attachments.state';
import { AttachmentComponent } from '../attachment/attachment.component';
import { Attachment, LoadingAttachment } from '@taiga/data';
import { trackByProp } from '~/app/shared/utils/track-by-prop';
import { DynamicTableModule } from '@taiga/ui/dynamic-table/dynamic-table.module';
import { ToolTipModule } from '@taiga/ui/tooltip';
import { TuiButtonModule } from '@taiga-ui/core';
import { NumberedPaginationComponent } from '@taiga/ui/numbered-pagination';

@Component({
  selector: 'tg-attachments-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    AttachmentComponent,
    DynamicTableModule,
    ToolTipModule,
    TuiButtonModule,
    NumberedPaginationComponent,
  ],
  templateUrl: './attachments-list.component.html',
  styleUrls: ['./attachments-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
})
export class AttachmentsListComponent {
  @Output()
  public invokeAttachment = new EventEmitter<void>();

  public state = inject(AttachmentsState);
  public model$ = this.state.paginatedList$;
  public trackById = trackByProp<Attachment | LoadingAttachment>('file');

  public onPageChange(page: number) {
    this.state.set({ page });
  }

  public toggleFold() {
    this.state.set((state) => ({ folded: !state.folded }));
  }
}
