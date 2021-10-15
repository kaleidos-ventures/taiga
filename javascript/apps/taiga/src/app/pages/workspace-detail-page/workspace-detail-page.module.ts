/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */
import { WorkspaceDetailModule } from '~/app/features/workspace-detail/workspace-detail.module';

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WorkspaceDetailPageRoutingModule } from './workspace-detail-page-routing.module';
import { WorkspaceDetailPageComponent } from './workspace-detail-page.component';

@NgModule({
  declarations: [
    WorkspaceDetailPageComponent
  ],
  imports: [
    CommonModule,
    WorkspaceDetailPageRoutingModule,
    WorkspaceDetailModule
  ]
})
export class WorkspaceDetailPageModule { }
