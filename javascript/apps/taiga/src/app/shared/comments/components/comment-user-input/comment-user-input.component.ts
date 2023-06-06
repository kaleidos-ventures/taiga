/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserAvatarComponent } from '~/app/shared/user-avatar/user-avatar.component';
import { Store } from '@ngrx/store';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { filterNil } from '~/app/shared/utils/operators';
import { RxState } from '@rx-angular/state';
import { User } from '@taiga/data';
import { TranslocoModule } from '@ngneat/transloco';

interface CommentUserInputComponentState {
  user: User;
}

@Component({
  selector: 'tg-comment-user-input',
  standalone: true,
  imports: [CommonModule, UserAvatarComponent, TranslocoModule],
  templateUrl: './comment-user-input.component.html',
  styleUrls: ['./comment-user-input.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class CommentUserInputComponent {
  public store = inject(Store);
  public state = inject(RxState<CommentUserInputComponentState>);
  public model$ = this.state.select();

  constructor() {
    this.state.connect('user', this.store.select(selectUser).pipe(filterNil()));
  }
}
