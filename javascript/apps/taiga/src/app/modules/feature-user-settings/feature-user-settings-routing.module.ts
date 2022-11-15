/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../auth/guards/auth.guard';
import { EditProfileComponent } from './components/edit-profile/edit-profile.component';
import { PreferencesComponent } from './components/preferences/preferences.component';
import { FeatureUserSettingsComponent } from './feature-user-settings.component';

const routes: Routes = [
  {
    path: '',
    component: FeatureUserSettingsComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'profile',
        component: EditProfileComponent,
      },
      {
        path: 'preferences',
        component: PreferencesComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FeatureUserSettingsRoutingModule {}
