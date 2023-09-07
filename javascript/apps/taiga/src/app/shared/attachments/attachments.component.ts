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
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { TuiButtonModule } from '@taiga-ui/core';
import { AttachmentsListComponent } from './components/attachments-list/attachments-list.component';
import { Attachment, LoadingAttachment } from '@taiga/data';
import { AttachmentsState } from './attachments.state';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ConfigService } from '@taiga/core';

import { trackByValue } from '../utils/track-by-value';
import { ContextNotificationComponent } from '@taiga/ui/context-notification/context-notification.component';

@Component({
  selector: 'tg-attachments',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    TuiButtonModule,
    AttachmentsListComponent,
    ContextNotificationComponent,
  ],
  templateUrl: './attachments.component.html',
  styleUrls: ['./attachments.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    AttachmentsState,
    {
      provide: TRANSLOCO_SCOPE,
      useValue: 'attachments',
    },
  ],
})
export class AttachmentsComponent {
  private state = inject(AttachmentsState);

  @ViewChild('fileInput')
  public fileInput!: ElementRef<HTMLInputElement>;

  @Output()
  public uploadFiles = new EventEmitter<File[]>();

  @Output()
  public deleteAttachment = this.state.deleteAttachment$;

  @Input()
  public set canEdit(canEdit: boolean) {
    this.state.set({ canEdit });
  }

  @Input()
  public set paginationItems(paginationItems: number) {
    this.state.set({ paginationItems });
  }

  @Input({ required: true })
  public set attachments(attachments: Attachment[]) {
    this.state.set({ attachments });
  }

  @Input({ required: true })
  public set loadingAttachments(loadingAttachments: LoadingAttachment[]) {
    this.state.set({ loadingAttachments });
  }

  public attachmentsTotal = toSignal(
    this.state.select().pipe(
      map(({ attachments, loadingAttachments }) => {
        return attachments.length + loadingAttachments.length;
      })
    )
  );

  public model$ = this.state.select();

  public configService = inject(ConfigService);

  public trackByName = trackByValue();

  public maxSizeInMb = Math.floor(
    this.configService.maxUploadFileSize / 1024 / 1024
  );

  public openFileSelector() {
    this.fileInput.nativeElement.click();
  }

  public onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;

    const validFiles = Array.from(target.files ?? []).filter((file) => {
      return file.size <= this.configService.maxUploadFileSize;
    });

    const invalidFiles = Array.from(target.files ?? []).filter((file) => {
      return file.size > this.configService.maxUploadFileSize;
    });

    if (validFiles) {
      this.state.set({
        folded: false,
      });
      this.uploadFiles.emit(validFiles);
    }

    if (invalidFiles.length) {
      this.state.set({
        showSizeError: invalidFiles.map((file) => file.name),
      });
    }

    this.fileInput.nativeElement.value = '';
  }
}
