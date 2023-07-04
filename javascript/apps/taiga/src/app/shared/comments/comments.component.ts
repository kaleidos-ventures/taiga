/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { RxFor } from '@rx-angular/template/for';
import { TuiButtonModule, TuiHintModule } from '@taiga-ui/core';
import { Story, UserComment } from '@taiga/data';
import { CodeHightlightDirective } from '../directives/code-highlight/code-highlight.directive';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { CommentSkeletonComponent } from './components/comment skeleton/comment-skeleton.component';
import { CommentSingleComponent } from './components/comment-single/comment-single.component';
import { CommentUserInputComponent } from './components/comment-user-input/comment-user-input.component';

export type OrderComments = '-createdAt' | 'createdAt';

@Component({
  selector: 'tg-comments',
  standalone: true,
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css'],
  imports: [
    CommonModule,
    RxFor,
    CodeHightlightDirective,
    TranslocoModule,
    TuiButtonModule,
    TuiHintModule,
    CommentUserInputComponent,
    CommentSkeletonComponent,
    CommentSingleComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'comments',
      },
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsComponent {
  @Input({ required: true }) public comments!: UserComment[] | null;
  @Input({ required: true }) public story!: Story | null;
  @Input({ required: true }) public total!: number | null;
  @Input({ required: true }) public order!: OrderComments;
  @Input({ required: true }) public loading!: boolean;
  @Input() public canComment = false;
  @Output() public changeOrder = new EventEmitter<OrderComments>();

  public localStorageService = inject(LocalStorageService);

  public toggleOrder(): void {
    const newOrder = this.order === 'createdAt' ? '-createdAt' : 'createdAt';

    this.localStorageService.set('comments_order', newOrder);

    this.changeOrder.emit(newOrder);
  }

  public openCommentInput(): void {
    alert(
      `
    (\\(\\
    ( -.-) "Work in progress"
    o_(")(")
    `
    );
  }

  public trackIndex(index: number): number {
    return index;
  }
}
