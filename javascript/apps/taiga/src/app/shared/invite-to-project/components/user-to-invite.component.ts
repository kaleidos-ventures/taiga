/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslocoService } from '@ngneat/transloco';
import { Role, User } from '@taiga/data';

@Component({
  selector: 'tg-user-to-invite',
  templateUrl: './user-to-invite.component.html',
  styleUrls: [
    '../styles/invite-to-project.shared.css',
    './user-to-invite.component.css',
  ],
})
export class UserToInviteComponent {
  constructor(private translocoService: TranslocoService) {}

  @Output()
  public delete = new EventEmitter<number>();

  @Input()
  public user!: FormGroup;

  @Input()
  public userIndex!: number;

  @Input()
  public roles!: Role[] | null;

  public get userObj(): Partial<User> {
    return {
      fullName: (this.user.value as Partial<User>).fullName,
      username: (this.user.value as Partial<User>).username,
      email: (this.user.value as Partial<User>).email,
    };
  }

  public trackByIndex(index: number) {
    return index;
  }

  public deleteUser() {
    this.delete.next(this.userIndex);
  }

  public insertionOrder() {
    return 0;
  }
}
