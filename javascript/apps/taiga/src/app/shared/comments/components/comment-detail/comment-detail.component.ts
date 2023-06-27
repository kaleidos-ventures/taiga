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
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import {
  TuiButtonModule,
  TuiDataListModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { Project, User, UserComment } from '@taiga/data';
import { map } from 'rxjs';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { DropdownModule } from '~/app/shared/dropdown/dropdown.module';
import { filterNil } from '~/app/shared/utils/operators';

interface CommentDetailComponentState {
  user: User;
  userIsAdmin: boolean;
}

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
  ],
  providers: [
    RxState,
    {
      provide: TRANSLOCO_SCOPE,
      useValue: 'comments',
    },
  ],
})
export class CommentDetailComponent {
  @Input() public comment!: UserComment;
  @Output() public highlightComment = new EventEmitter<string | undefined>();

  public store = inject(Store);
  public state = inject(RxState<CommentDetailComponentState>);
  public model$ = this.state.select();

  public showDeleteCommentConfirm = false;

  public get commentOptionsState() {
    return this.#commentOptionsState;
  }

  public set commentOptionsState(value: boolean) {
    this.#commentOptionsState = value;
    if (!value) {
      this.showDeleteCommentConfirm = false;
      this.highlightComment.next(undefined);
    }
  }

  #commentOptionsState = false;

  constructor() {
    this.state.connect('user', this.store.select(selectUser).pipe(filterNil()));
    this.state.connect(
      'userIsAdmin',
      this.store.select(selectCurrentProject).pipe(
        filterNil(),
        map((project: Project) => project.userIsAdmin)
      )
    );
  }

  public deleteConfirm() {
    this.showDeleteCommentConfirm = true;
    this.highlightComment.next(this.comment.id);
  }

  public deleteComment() {
    this.commentOptionsState = false;
    // Dispatch deletion
  }
}
