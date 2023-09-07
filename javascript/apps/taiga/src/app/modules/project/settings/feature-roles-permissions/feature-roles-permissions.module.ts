/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TuiLinkModule, TuiSvgModule } from '@taiga-ui/core';
import { TuiToggleModule } from '@taiga-ui/kit';

import { TitleComponent } from '~/app/shared/title/title.component';
import { RolesPermissionsEffects } from './+state/effects/roles-permissions.effects';
import { rolesPermissionsFeature } from './+state/reducers/roles-permissions.reducer';
import { ModalPermissionComparisonModule } from './components/modal-permission-comparison/modal-permission-comparison.module';
import { RoleAdvanceRowModule } from './components/role-advance-row/role-advance-row.module';
import { RoleCustomizeModule } from './components/role-customize/role-customize.module';
import { RolePermissionRowModule } from './components/role-permission-row/role-permission-row.module';
import { ProjectSettingsFeatureRolesPermissionsComponent } from './feature-roles-permissions.component';

@NgModule({
  imports: [
    TuiLinkModule,
    TuiSvgModule,
    TuiToggleModule,
    RolePermissionRowModule,
    RoleCustomizeModule,
    RoleAdvanceRowModule,
    ModalPermissionComparisonModule,
    RouterModule.forChild([
      {
        path: '',
        component: ProjectSettingsFeatureRolesPermissionsComponent,
      },
    ]),
    StoreModule.forFeature(rolesPermissionsFeature),
    EffectsModule.forFeature([RolesPermissionsEffects]),
    TitleComponent,
    ProjectSettingsFeatureRolesPermissionsComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'project_settings',
        alias: 'project_settings',
      },
    },
  ],
})
export class ProjectsSettingsFeatureRolesPermissionsModule {}
