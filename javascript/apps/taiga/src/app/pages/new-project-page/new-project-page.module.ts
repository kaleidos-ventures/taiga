/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NewProjectPageRoutingModule } from './new-project-page-routing.module';
import { NewProjectPageComponent } from './new-project-page.component';
import { RouterModule } from '@angular/router';
import { NewProjectModule } from '~/app/features/new-project/new-project.module';

@NgModule({
  declarations: [
    NewProjectPageComponent
  ],
  imports: [
    CommonModule,
    NewProjectPageRoutingModule,
    NewProjectModule,
    RouterModule
  ]
})
export class NewProjectPageModule { }
