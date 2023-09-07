/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective } from '@ngneat/transloco';
import {
  TuiButtonModule,
  TuiDataListModule,
  TuiLinkModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { TuiSelectModule } from '@taiga-ui/kit';
import { Role, User } from '@taiga/data';
import { BadgeComponent } from '@taiga/ui/badge/badge.component';
import { SelectComponent } from '@taiga/ui/inputs/select/select.component';
import { TooltipDirective } from '@taiga/ui/tooltip/tooltip.directive';

import { UserCardComponent } from '~/app/shared/user-card/user-card.component';
import { capitalizePipe } from '~/app/shared/pipes/capitalize/capitalize.pipe';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'tg-user-to-invite',
  standalone: true,
  templateUrl: './user-to-invite.component.html',
  styleUrls: [
    '../styles/invite-user-modal.shared.css',
    './user-to-invite.component.css',
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TuiLinkModule,
    TuiSvgModule,
    UserCardComponent,
    TooltipDirective,
    BadgeComponent,
    SelectComponent,
    TuiSelectModule,
    TuiDataListModule,
    capitalizePipe,
    TranslocoDirective,
    TuiButtonModule,
  ],
})
export class UserToInviteComponent {
  @Output()
  public delete = new EventEmitter<number>();

  @Input()
  public user!: FormGroup;

  @Input()
  public userIndex!: number;

  @Input()
  public roles?: Role[] | null;

  public get userObj(): Partial<User> {
    return {
      fullName: (this.user.value as Partial<User>).fullName,
      username: (this.user.value as Partial<User>).username,
      email: (this.user.value as Partial<User>).email,
      color: (this.user.value as Partial<User>).color,
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
