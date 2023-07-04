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
  HostBinding,
  HostListener,
  Input,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@ngneat/transloco';
import { TuiButtonModule } from '@taiga-ui/core';
import { Story, UserComment } from '@taiga/data';
import { StoryDetailDescriptionImageUploadService } from '~/app/modules/project/story-detail/components/story-detail-description/story-detail-description-image-upload.service';
import { DiscardChangesModalComponent } from '~/app/shared/discard-changes-modal/discard-changes-modal.component';
import { EditorImageUploadService } from '~/app/shared/editor/editor-image-upload.service';
import { EditorComponent } from '~/app/shared/editor/editor.component';
import { DateDistancePipe } from '~/app/shared/pipes/date-distance/date-distance.pipe';
import { SafeHtmlPipe } from '~/app/shared/pipes/safe-html/safe-html.pipe';
import { UserAvatarComponent } from '~/app/shared/user-avatar/user-avatar.component';
import { CommentDetailComponent } from '../comment-detail/comment-detail.component';

@Component({
  selector: 'tg-comment',
  templateUrl: './comment-single.component.html',
  styleUrls: ['./comment-single.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslocoModule,
    UserAvatarComponent,
    DateDistancePipe,
    CommentDetailComponent,
    SafeHtmlPipe,
    EditorComponent,
    ReactiveFormsModule,
    DiscardChangesModalComponent,
    TuiButtonModule,
  ],
  providers: [
    {
      provide: EditorImageUploadService,
      useClass: StoryDetailDescriptionImageUploadService,
    },
  ],
})
export class CommentSingleComponent {
  @Input({ required: true }) public comment!: UserComment;
  @Input({ required: true }) public story!: Story | null;

  @HostBinding('class.highlighted') public get highlighted() {
    return this.highlightedComment;
  }

  @HostListener('window:beforeunload')
  public unloadHandler() {
    return !this.hasChanges();
  }

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

  public highlightComment(value: boolean): void {
    this.highlightedComment = value;
  }

  public displayEditComment(value: boolean): void {
    this.editComment = value;
  }

  public displayConfirmEditCommentModal(value: boolean): void {
    this.showConfirmEditCommentModal = value;
  }

  public onInitEditor() {
    this.editorReady = true;
    this.setComment(this.comment.text);
  }

  public onContentChange(content: string) {
    this.setComment(content);
  }

  public cancelEditComment() {
    if (this.hasChanges()) {
      this.displayConfirmEditCommentModal(true);
    } else {
      this.displayEditComment(false);
    }
  }

  public hasChanges() {
    return this.comment.text !== this.editCommentForm.get('comment')!.value;
  }

  public saveEdit() {
    console.log(this.editCommentForm.value);
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
