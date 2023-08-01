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
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { RxFor } from '@rx-angular/template/for';
import {
  TuiButtonModule,
  TuiHintModule,
  TuiNotification,
} from '@taiga-ui/core';
import { User, UserComment } from '@taiga/data';
import { AppService } from '~/app/services/app.service';
import { WsService } from '~/app/services/ws';
import { CodeHightlightDirective } from '../directives/code-highlight/code-highlight.directive';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { RealTimeDateDistanceComponent } from '../real-time-date-distance/real-time-date-distance.component';
import { CommentSkeletonComponent } from './components/comment skeleton/comment-skeleton.component';
import { CommentSingleComponent } from './components/comment-single/comment-single.component';
import { CommentUserInputComponent } from './components/comment-user-input/comment-user-input.component';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { StoryDetailApiActions } from '~/app/modules/project/story-detail/data-access/+state/actions/story-detail.actions';

export type OrderComments = '-createdAt' | 'createdAt';

export interface CommentsComponentState {
  deletedComment: string;
  editComment: Pick<UserComment, 'text' | 'id'>;
  user: User;
}

@UntilDestroy()
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
    RealTimeDateDistanceComponent,
    CommentSingleComponent,
  ],
  providers: [
    RxState,
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'comments',
      },
    },
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsComponent implements OnInit {
  @Input({ required: true }) public comments!: UserComment[] | null;
  @Input({ required: true }) public total!: number | null;
  @Input({ required: true }) public activeComments!: number | null;
  @Input({ required: true }) public order!: OrderComments;
  @Input({ required: true }) public loading!: boolean;
  @Input({ required: true }) public user!: User;
  @Input() public canComment = false;
  @Output() public changeOrder = new EventEmitter<OrderComments>();
  @Output() public comment = new EventEmitter<string>();
  @Output() public deleteComment = new EventEmitter<string>();
  @Output() public editComment = new EventEmitter<
    CommentsComponentState['editComment']
  >();

  public localStorageService = inject(LocalStorageService);
  public wsService = inject(WsService);
  public store = inject(Store);
  public appService = inject(AppService);
  public state = inject(RxState) as RxState<CommentsComponentState>;

  public selectedComment?: string;

  public ngOnInit(): void {
    this.watchState();
    this.events();
  }

  public watchState() {
    this.state.hold(this.state.select('deletedComment'), (id) => {
      if (id) {
        this.onDeleteComment(id);
      }
    });
    this.state.hold(this.state.select('editComment'), (comment) => {
      if (comment.id) {
        this.onEditComment(comment);
      }
    });

    this.state.set({ user: this.user });
  }

  public toggleOrder(): void {
    const newOrder = this.order === 'createdAt' ? '-createdAt' : 'createdAt';

    this.localStorageService.set('comments_order', newOrder);

    this.changeOrder.emit(newOrder);
  }

  public trackById(_index: number, comment: UserComment): string {
    return comment.id;
  }

  public onDeleteComment(commentId: string): void {
    this.deleteComment.emit(commentId);
    this.state.set({ deletedComment: '' });
  }

  public onEditComment(comment: CommentsComponentState['editComment']): void {
    this.editComment.emit(comment);
    this.state.set({
      editComment: {
        id: '',
        text: '',
      },
    });
  }

  public selectComment(commentId: string): void {
    this.selectedComment = commentId;
  }

  private events(): void {
    this.wsService
      .projectEvents<{
        ref: number;
        comment: Required<UserComment>;
      }>('stories.comments.delete')
      .pipe(untilDestroyed(this))
      .subscribe((msg) => {
        if (this.selectedComment === msg.event.content.comment.id) {
          this.appService.toastNotification({
            message: 'deleted.already_deleted_message',
            status: TuiNotification.Info,
            scope: 'comments',
            autoClose: true,
          });
        }

        this.store.dispatch(
          StoryDetailApiActions.deleteCommentSuccess({
            commentId: msg.event.content.comment.id,
            deletedBy: msg.event.content.comment.deletedBy,
            deletedAt: msg.event.content.comment.deletedAt,
          })
        );
      });
  }
}
