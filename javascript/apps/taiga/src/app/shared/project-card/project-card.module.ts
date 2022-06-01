/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { TuiButtonModule, TuiSvgModule } from '@taiga-ui/core';
import { AvatarModule } from '@taiga/ui/avatar';
import { DataAccessInvitationToProjectModule } from '../invite-to-project/data-access/+state/invite-to-project-data-access.module';
import { InviteToProjectModule } from '../invite-to-project/invite-to-project.module';
import { ProjectCardComponent } from './project-card.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    TuiButtonModule,
    TuiSvgModule,
    TranslocoModule,
    AvatarModule,
    InviteToProjectModule,
    DataAccessInvitationToProjectModule,
  ],
  declarations: [ProjectCardComponent],
  providers: [],
  exports: [ProjectCardComponent],
})
export class ProjectCardModule {}
