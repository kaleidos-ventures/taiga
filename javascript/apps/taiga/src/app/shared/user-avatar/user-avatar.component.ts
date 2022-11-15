/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { TuiSizeXS, TuiSizeXXL } from '@taiga-ui/core';
import { User } from '@taiga/data';
import { AvatarModule } from '@taiga/ui/avatar';
import { filter } from 'rxjs/operators';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';

interface State {
  user: Partial<User>;
}

@Component({
  selector: 'tg-user-avatar',
  standalone: true,
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  imports: [CommonModule, AvatarModule],
})
export class UserAvatarComponent implements OnInit {
  @Input()
  public rounded = false;

  @Input()
  public size: TuiSizeXS | TuiSizeXXL = 'l';

  @Input()
  public color = 1;

  @Input()
  public type: 'dark' | 'light' = 'light';

  @Input()
  public set user(user: Partial<User>) {
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
