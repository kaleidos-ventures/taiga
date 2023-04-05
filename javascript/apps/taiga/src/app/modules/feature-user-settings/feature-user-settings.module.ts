/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { WatchElementDirective } from '~/app/shared/directives/watch-element/watch-element.directive';
import { TitleComponent } from '~/app/shared/title/title.component';
import { EditProfileComponent } from './components/edit-profile/edit-profile.component';
import { PreferencesComponent } from './components/preferences/preferences.component';
import { DataAccessUserSettingsModule } from './data-access/user-settings-data-access.module';
import { FeatureUserSettingsRoutingModule } from './feature-user-settings-routing.module';
import { FeatureUserSettingsComponent } from './feature-user-settings.component';

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
    TitleComponent,
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
