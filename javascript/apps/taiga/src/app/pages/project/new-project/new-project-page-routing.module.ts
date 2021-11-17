/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NewProjectPendingChangesGuard } from '~/app/features/project/new-project/new-project-pending-changes.guard';
import { NewProjectPageComponent } from './new-project-page.component';

const routes: Routes = [
  {
    path: '',
    component: NewProjectPageComponent,
    canDeactivate: [ NewProjectPendingChangesGuard ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NewProjectPageRoutingModule { }
