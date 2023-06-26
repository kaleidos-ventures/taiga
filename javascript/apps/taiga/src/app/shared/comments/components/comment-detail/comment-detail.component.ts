/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import {
  TuiButtonModule,
  TuiDataListModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { DropdownModule } from '~/app/shared/dropdown/dropdown.module';

@Component({
  selector: 'tg-comment-detail',
  standalone: true,
  templateUrl: './comment-detail.component.html',
  styleUrls: ['./comment-detail.component.css'],
  imports: [
    CommonModule,
    DropdownModule,
    TranslocoModule,
    TuiSvgModule,
    TuiDataListModule,
    TuiButtonModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: 'comments',
    },
  ],
})
export class CommentDetailComponent {
  public commentOptionsState = false;
  public showDeleteCommentConfirm = false;

  public deleteCommentConfirm(): void {
    this.showDeleteCommentConfirm = true;
  }

  public closeDeleteCommentConfirm(): void {
    this.commentOptionsState = false;
    this.showDeleteCommentConfirm = false;
  }

  public deleteComment() {
    // Dispatch deletion
  }
}
