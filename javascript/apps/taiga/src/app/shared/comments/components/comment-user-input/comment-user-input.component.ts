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
  DestroyRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
} from '@angular/core';
import { UserAvatarComponent } from '~/app/shared/user-avatar/user-avatar.component';
import { Store } from '@ngrx/store';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { filterFalsy, filterNil } from '~/app/shared/utils/operators';
import { RxState } from '@rx-angular/state';
import { User } from '@taiga/data';
import { EditorComponent } from '~/app/shared/editor/editor.component';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { DiscardChangesModalComponent } from '~/app/shared/discard-changes-modal/discard-changes-modal.component';
import { ComponentCanDeactivate } from '~/app/shared/can-deactivate/can-deactivate.guard';
import { CanDeactivateService } from '~/app/shared/can-deactivate/can-deactivate.service';
import { Subject, filter, merge, of, take, throttleTime } from 'rxjs';
import { CommentsAutoScrollDirective } from '~/app/shared/comments/directives/comments-auto-scroll.directive';
import { OrderComments } from '~/app/shared/comments/comments.component';
import { ResizedDirective } from '~/app/shared/resize/resize.directive';
import { RestoreFocusDirective } from '~/app/shared/directives/restore-focus/restore-focus.directive';
import { RestoreFocusTargetDirective } from '~/app/shared/directives/restore-focus/restore-focus-target.directive';

interface CommentUserInputComponentState {
  user: User;
  open: boolean;
  editorReady: boolean;
  comment: string;
  showConfirmationModal: boolean;
}

@Component({
  selector: 'tg-comment-user-input',
  standalone: true,
  imports: [
    CommonTemplateModule,
    UserAvatarComponent,
    EditorComponent,
    DiscardChangesModalComponent,
    ResizedDirective,
    RestoreFocusDirective,
    RestoreFocusTargetDirective,
  ],
  templateUrl: './comment-user-input.component.html',
  styleUrls: ['./comment-user-input.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class CommentUserInputComponent implements ComponentCanDeactivate {
  @Input({ required: true })
  public order!: OrderComments;

  @Output()
  public saved = new EventEmitter<string>();

  @HostListener('window:beforeunload')
  public beforeunload() {
    return !this.hasChanges();
  }

  public commentsAutoScrollDirective = inject(CommentsAutoScrollDirective, {
    optional: true,
  });
  public store = inject(Store);
  public state = inject(RxState) as RxState<CommentUserInputComponentState>;
  public model$ = this.state.select();
  public discard$ = new Subject<boolean>();
  public resizeEditor$ = new Subject<void>();
  public toolbar = 'bold italic underline link image codesample emoticons';

  constructor() {
    this.reset();

    this.state.connect('user', this.store.select(selectUser).pipe(filterNil()));

    const canDeactivateService = inject(CanDeactivateService);
    canDeactivateService.addComponent(this, inject(DestroyRef));

    this.state.hold(this.discard$, (discard) => {
      if (discard) {
        this.discard();
      } else {
        this.keepEditing();
      }
    });

    this.state.hold(
      merge(
        this.state.select('editorReady').pipe(filterFalsy()),
        this.resizeEditor$
      ).pipe(
        filter(() => this.order === 'createdAt'),
        throttleTime(100)
      ),
      () => {
        this.commentsAutoScrollDirective?.scrollToBottom();
      }
    );
  }

  public canDeactivate() {
    if (this.hasChanges()) {
      this.state.set({ showConfirmationModal: true });

      return this.discard$.pipe(take(1));
    }

    return of(true);
  }

  public open() {
    this.state.set({
      comment: '',
      editorReady: false,
      showConfirmationModal: false,
      open: true,
    });
  }

  public cancel() {
    if (this.hasChanges()) {
      this.state.set({ showConfirmationModal: true });
      return false;
    }

    this.state.set({ open: false, editorReady: false });
    return true;
  }

  public onCommentContentChange(comment: string) {
    this.state.set({ comment });
  }

  public onInitEditor() {
    this.state.set({ editorReady: true });
  }

  public hasChanges() {
    return this.state.get('comment').trim().length > 0;
  }

  public save() {
    this.saved.emit(this.state.get('comment'));
    this.reset();
  }

  private discard() {
    this.state.set({ showConfirmationModal: false, open: false });
  }

  private keepEditing() {
    this.state.set({ showConfirmationModal: false });
  }

  private reset() {
    this.state.set({
      comment: '',
      editorReady: false,
      showConfirmationModal: false,
      open: false,
    });
  }
}
