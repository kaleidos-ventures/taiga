/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */
import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { User } from '@taiga/data';
import { Store } from '@ngrx/store';
import { logout } from '~/app/modules/auth/data-access/+state/actions/auth.actions';

@Component({
  selector: 'tg-navigation-user-dropdown',
  templateUrl: './navigation-user-dropdown.component.html',
  styleUrls: ['./navigation-user-dropdown.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationUserDropdownComponent {
  @Input()
  public user!: User;

  constructor(private store: Store) {}

  public logout() {
    this.store.dispatch(logout());
  }
}
