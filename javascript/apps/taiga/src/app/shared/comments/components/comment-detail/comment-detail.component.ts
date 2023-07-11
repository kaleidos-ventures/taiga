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
  DestroyRef,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { Store } from '@ngrx/store';
import { TuiAutoFocusModule } from '@taiga-ui/cdk';
import {
  TuiButtonModule,
  TuiDataListModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { ShortcutsService } from '@taiga/core';
import { User, UserComment, StoryView } from '@taiga/data';
import { Subject, takeUntil } from 'rxjs';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { selectStoryView } from '~/app/modules/project/story-detail/data-access/+state/selectors/story-detail.selectors';
import { DropdownModule } from '~/app/shared/dropdown/dropdown.module';

@Component({
  selector: 'tg-comment-detail',
  standalone: true,
  templateUrl: './comment-detail.component.html',
  styleUrls: ['./comment-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DropdownModule,
    TranslocoModule,
    TuiSvgModule,
    TuiDataListModule,
    TuiButtonModule,
    TuiAutoFocusModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: 'comments',
    },
  ],
})
export class CommentDetailComponent {
  @Input({ required: true }) public comment!: UserComment;
  @Input({ required: true }) public canComment!: boolean;
  @Input({ required: true }) public user!: User;

  @Output() public highlightComment = new EventEmitter<string | undefined>();
  @Output() public deleteComment = new EventEmitter<string>();

  public store = inject(Store);
  public shortcutsService = inject(ShortcutsService);
  public destroyRef = inject(DestroyRef);
  public project = this.store.selectSignal(selectCurrentProject);
  public storyView = this.store.selectSignal(selectStoryView);
  public sideView: StoryView = 'side-view';

  public showDeleteCommentConfirm = false;
  public commentOptionsState = false;

  private unsetDelete$: Subject<void> = new Subject();

  public deleteConfirm(): void {
    this.showDeleteCommentConfirm = true;
    this.highlightComment.next(this.comment.id);
  }

  public changeCommentOptionsState(state: boolean): void {
    this.commentOptionsState = state;
    if (!state) {
      this.showDeleteCommentConfirm = false;
      this.highlightComment.next(undefined);
      this.unsetDelete$.next();
    } else {
      this.setDeleteShortcut();
    }
  }

  public confirmedDeleteComment(): void {
    this.changeCommentOptionsState(false);
    this.deleteComment.emit(this.comment.id);
  }

  private setDeleteShortcut(): void {
    this.shortcutsService.setScope('comment-detail');
    this.shortcutsService
      .task('comment.delete')
      .pipe(takeUntilDestroyed(this.destroyRef), takeUntil(this.unsetDelete$))
      .subscribe(() => {
        this.deleteConfirm();
      });
  }
}
