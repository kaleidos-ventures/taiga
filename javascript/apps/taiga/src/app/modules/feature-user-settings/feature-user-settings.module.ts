/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatureUserSettingsRoutingModule } from './feature-user-settings-routing.module';
import { FeatureUserSettingsComponent } from './feature-user-settings.component';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { PreferencesComponent } from './components/preferences/preferences.component';
import { EditProfileComponent } from './components/edit-profile/edit-profile.component';
import { WatchElementDirective } from '~/app/shared/directives/watch-element/watch-element.directive';
import { DataAccessUserSettingsModule } from './data-access/user-settings-data-access.module';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    FeatureUserSettingsComponent,
    EditProfileComponent,
    PreferencesComponent,
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    FeatureUserSettingsRoutingModule,
    TranslocoModule,
    WatchElementDirective,
    DataAccessUserSettingsModule,
    InputsModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'user_settings',
        alias: 'user_settings',
      },
    },
  ],
})
export class FeatureUserSettingsModule {}
