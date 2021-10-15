/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { WorkspaceModule } from '~/app/features/workspace/workspace.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WorkspacePageRoutingModule } from './workspace-page-routing.module';
import { WorkspacePageComponent } from './workspace-page.component';

@NgModule({
  declarations: [
    WorkspacePageComponent,
  ],
  imports: [
    CommonModule,
    WorkspacePageRoutingModule,
    WorkspaceModule
  ]
})
export class WorkspacePageModule { }
