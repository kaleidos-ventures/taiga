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
  HostBinding,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@ngneat/transloco';
import { RxState } from '@rx-angular/state';
import {
  TuiButtonModule,
  TuiHostedDropdownModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { UserComment } from '@taiga/data';

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
import { DeletedCommentComponent } from '../deleted-comment/deleted-comment.component';
import { TooltipDirective } from '@taiga/ui/tooltip/tooltip.directive';
import { NouserAvatarComponent } from '~/app/shared/nouser-avatar/nouser-avatar.component';
import { BadgeComponent } from '@taiga/ui/badge/badge.component';

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
    DateDistancePipe,
    TooltipDirective,
    TuiHostedDropdownModule,
    DeletedCommentComponent,
    TuiSvgModule,
    NouserAvatarComponent,
    BadgeComponent,
    TooltipDirective,
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
  @HostBinding('class.highlighted') public highlightedComment = false;

  @Input({ required: true }) public comment!: UserComment;
  @Input({ required: true }) public canComment = false;

  @Output() public selectComment = new EventEmitter<string>();

  @HostListener('window:beforeunload')
  public unloadHandler() {
    return !this.hasChanges();
  }

  public state = inject<RxState<CommentsComponentState>>(RxState);

  public deletedComment = this.state.get('deletedComment');
  public user = this.state.get('user');

  public editComment = false;

  public editorReady = false;
  public commentsToolbar =
    'bold italic underline | link image codesample | emoticons';

  public showConfirmEditCommentModal = false;
  public confirmDelete = false;

  public editCommentForm = new FormGroup({
    comment: new FormControl('', {
      nonNullable: true,
    }),
  });

  public discard$ = new Subject<boolean>();

  public isDeleted = false;

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
    this.displayConfirmDeleteComment(false);
    this.state.set({ deletedComment: this.comment.id });
    this.isDeleted = true;
  }

  public onHighlightComment(value: boolean): void {
    this.highlightedComment = value;
    this.selectComment.emit(this.comment.id);
  }

  public displayEditComment(value: boolean): void {
    this.editComment = value;
  }

  public displayConfirmDeleteComment(value: boolean): void {
    this.onHighlightComment(value);
    this.confirmDelete = value;
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
    const comment = this.editCommentForm.get('comment')!.value;

    if (comment) {
      this.state.set({
        editComment: {
          id: this.comment.id,
          text: this.editCommentForm.get('comment')!.value,
        },
      });
      this.displayEditComment(false);
      this.displayConfirmDeleteComment(false);
      this.resetForm();
    } else {
      this.displayConfirmDeleteComment(true);
    }
  }

  public onContentChange(content: string) {
    this.setComment(content);
  }

  public discard() {
    this.displayEditComment(false);
    this.displayConfirmEditCommentModal(false);
    this.resetForm();
  }

  public keepEditing() {
    this.displayConfirmEditCommentModal(false);
  }

  public resetForm() {
    this.editCommentForm.get('comment')?.setValue(this.comment.text);
    this.editCommentForm.markAsPristine();
  }

  private setComment(value: string) {
    this.editCommentForm.get('comment')!.setValue(value);
  }
}
