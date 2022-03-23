/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputsModule } from 'libs/ui/src/lib/inputs/inputs.module';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiButtonModule, TuiSvgModule, TuiLinkModule } from '@taiga-ui/core';
import { UserToInviteComponent } from './user-to-invite.component';
import { UserAvatarModule } from '~/app/shared/user-avatar/user-avatar.component.module';

@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    UserAvatarModule,
    TuiButtonModule,
    TuiLinkModule,
    InputsModule,
    TuiSvgModule,
    TranslocoModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'kanban',
        alias: 'kanban',
      },
    },
  ],
  declarations: [UserToInviteComponent],
  exports: [UserToInviteComponent],
})
export class UserToInviteModule {}
