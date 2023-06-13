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
} from '@angular/core';
import { UserComment } from '@taiga/data';
import { RxFor } from '@rx-angular/template/for';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { DateDistancePipe } from '../pipes/date-distance/date-distance.pipe';
import { CodeHightlightDirective } from '../directives/code-highlight/code-highlight.directive';
import { SafeHtmlPipe } from '../pipes/safe-html/safe-html.pipe';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { TuiButtonModule, TuiHintModule } from '@taiga-ui/core';
import { CommentUserInputComponent } from './components/comment-user-input/comment-user-input.component';
import { CommentSkeletonComponent } from './components/comment skeleton/comment-skeleton.component';

export type OrderComments = '-createdAt' | 'createdAt';

@Component({
  selector: 'tg-comments',
  standalone: true,
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css'],
  imports: [
    CommonModule,
    RxFor,
    UserAvatarComponent,
    DateDistancePipe,
    CodeHightlightDirective,
    SafeHtmlPipe,
    TranslocoModule,
    TuiButtonModule,
    TuiHintModule,
    CommentUserInputComponent,
    CommentSkeletonComponent,
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
  @Input({ required: true }) public total!: number | null;
  @Input({ required: true }) public order!: OrderComments;
  @Input({ required: true }) public loading!: boolean;
  @Input() public canComment = false;
  @Output() public changeOrder = new EventEmitter<OrderComments>();

  public toggleOrder(): void {
    this.changeOrder.emit(
      this.order === 'createdAt' ? '-createdAt' : 'createdAt'
    );
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
