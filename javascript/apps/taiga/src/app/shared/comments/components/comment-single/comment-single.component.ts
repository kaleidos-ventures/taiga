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
  HostListener,
  Input,
  inject,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@ngneat/transloco';
import { RxState } from '@rx-angular/state';
import { TuiButtonModule, TuiHintModule } from '@taiga-ui/core';
import { UserComment } from '@taiga/data';
import { BadgeModule } from '@taiga/ui/badge/badge.module';
import { Subject, of, take } from 'rxjs';
import { StoryDetaiImageUploadService } from '~/app/modules/project/story-detail/story-detail-image-upload.service';
import { CanDeactivateService } from '~/app/shared/can-deactivate/can-deactivate.service';
import { CommentsComponentState } from '~/app/shared/comments/comments.component';
import { CommentDetailComponent } from '~/app/shared/comments/components/comment-detail/comment-detail.component';
import { DiscardChangesModalComponent } from '~/app/shared/discard-changes-modal/discard-changes-modal.component';
import { EditorImageUploadService } from '~/app/shared/editor/editor-image-upload.service';
import { EditorComponent } from '~/app/shared/editor/editor.component';
import { DateDistancePipe } from '~/app/shared/pipes/date-distance/date-distance.pipe';
import { SafeHtmlPipe } from '~/app/shared/pipes/safe-html/safe-html.pipe';
import { RealTimeDateDistanceComponent } from '~/app/shared/real-time-date-distance/real-time-date-distance.component';
import { UserAvatarComponent } from '~/app/shared/user-avatar/user-avatar.component';
import { fadeIntOutAnimation } from '~/app/shared/utils/animations';

@Component({
  selector: 'tg-comment',
  templateUrl: './comment-single.component.html',
  styleUrls: ['./comment-single.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    UserAvatarComponent,
    RealTimeDateDistanceComponent,
    CommentDetailComponent,
    SafeHtmlPipe,
    EditorComponent,
    ReactiveFormsModule,
    EditorComponent,
    DiscardChangesModalComponent,
    TuiButtonModule,
    BadgeModule,
    DateDistancePipe,
    TuiHintModule,
  ],
  animations: [fadeIntOutAnimation],
  providers: [
    {
      provide: EditorImageUploadService,
      useClass: StoryDetaiImageUploadService,
    },
  ],
})
export class CommentSingleComponent {
  @Input({ required: true }) public comment!: UserComment;
  @Input({ required: true }) public canComment = false;

  @HostListener('window:beforeunload')
  public unloadHandler() {
    return !this.hasChanges();
  }

  public state = inject<RxState<CommentsComponentState>>(RxState);

  public deletedComment = this.state.get('deletedComment');
  public user = this.state.get('user');

  public highlightedComment = false;
  public editComment = false;

  public editorReady = false;
  public commentsToolbar =
    'bold italic underline | link image codesample | emoticons';

  public showConfirmEditCommentModal = false;

  public editCommentForm = new FormGroup({
    comment: new FormControl('', {
      nonNullable: true,
    }),
  });

  public discard$ = new Subject<boolean>();

  constructor() {
    const canDeactivateService = inject(CanDeactivateService);
    canDeactivateService.addComponent(this, inject(DestroyRef));

    this.state.hold(this.discard$, (discard) => {
      if (discard) {
        this.discard();
      } else {
        this.keepEditing();
      }
    });
  }

  public canDeactivate() {
    if (this.hasChanges()) {
      this.displayConfirmEditCommentModal(true);

      return this.discard$.pipe(take(1));
    }

    return of(true);
  }

  public onInitEditor() {
    this.editorReady = true;
    this.setComment(this.comment.text);
  }

  public onDeleteComment() {
    this.state.set({ deletedComment: this.comment.id });
  }

  public onHighlightComment(value: boolean): void {
    this.highlightedComment = value;
  }

  public displayEditComment(value: boolean): void {
    this.editComment = value;
  }

  public displayConfirmEditCommentModal(value: boolean): void {
    this.showConfirmEditCommentModal = value;
  }

  public hasChanges() {
    return (
      this.editComment &&
      this.comment.text !== this.editCommentForm.get('comment')!.value
    );
  }

  public cancelEditComment() {
    if (this.hasChanges()) {
      this.displayConfirmEditCommentModal(true);
    } else {
      this.displayEditComment(false);
    }
  }

  public saveEdit() {
    this.state.set({
      editComment: {
        id: this.comment.id,
        text: this.editCommentForm.get('comment')!.value,
      },
    });
    this.displayEditComment(false);
    this.reset();
  }

  public onContentChange(content: string) {
    this.setComment(content);
  }

  public discard() {
    this.displayEditComment(false);
    this.displayConfirmEditCommentModal(false);
    this.reset();
  }

  public keepEditing() {
    this.displayConfirmEditCommentModal(false);
  }

  public reset() {
    this.editCommentForm.get('comment')?.setValue(this.comment.text);
    this.editCommentForm.markAsPristine();
  }

  private setComment(value: string) {
    this.editCommentForm.get('comment')!.setValue(value);
  }
}
