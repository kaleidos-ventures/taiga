/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { selectUser } from '@/app/pages/auth/selectors/auth.selectors';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { User } from '@taiga/data';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'tg-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavigationComponent  {
  public openProjectsDropdown = false;
  public openUserDropdown = false;

  public user$ = this.store.select(selectUser);

  constructor(private store: Store) {}
}
