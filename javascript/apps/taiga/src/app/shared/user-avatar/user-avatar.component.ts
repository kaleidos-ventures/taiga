/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnInit,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { TuiSizeXS, TuiSizeXXL } from '@taiga-ui/core';
import { User } from '@taiga/data';
import { filter } from 'rxjs/operators';

interface State {
  user: User;
}

@Component({
  selector: 'tg-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class UserAvatarComponent implements OnInit {
  @Input()
  public rounded = true;

  @Input()
  public size: TuiSizeXS | TuiSizeXXL = 's';

  @Input()
  public set user(user: User) {
    this.state.set({ user });
  }

  public user$ = this.state.select('user');

  constructor(private store: Store, private state: RxState<State>) {}

  public ngOnInit() {
    if (!this.state.get('user')) {
      this.state.connect(
        'user',
        this.store
          .select(selectUser)
          .pipe(filter((user): user is User => !!user))
      );
    }
  }
}
