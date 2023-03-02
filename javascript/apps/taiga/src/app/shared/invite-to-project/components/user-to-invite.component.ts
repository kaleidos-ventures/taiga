/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslocoService, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiHintModule, TuiLinkModule, TuiSvgModule } from '@taiga-ui/core';
import { Role, User } from '@taiga/data';
import { BadgeModule } from '@taiga/ui/badge/badge.module';
import { InputsModule } from 'libs/ui/src/lib/inputs/inputs.module';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { CapitalizePipeModule } from '~/app/shared/pipes/capitalize/capitalize.pipe.module';
import { UserCardComponent } from '~/app/shared/user-card/user-card.component';

@Component({
  selector: 'tg-user-to-invite',
  standalone: true,
  templateUrl: './user-to-invite.component.html',
  styleUrls: [
    '../styles/invite-to-project.shared.css',
    './user-to-invite.component.css',
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TuiLinkModule,
    InputsModule,
    TuiSvgModule,
    TuiHintModule,
    CommonTemplateModule,
    UserCardComponent,
    BadgeModule,
    CapitalizePipeModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'invitation_modal',
        alias: 'invitation_modal',
      },
    },
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
