/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectSettingsFeatureRolesPermissionsComponent } from './feature-roles-permissions.component';
import { inViewportDirective } from '~/app/shared/directives/intersection-observer.directive';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { TuiButtonModule, TuiLinkModule, TuiSvgModule } from '@taiga-ui/core';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiToggleModule } from '@taiga-ui/kit';
import { RolePermissionRowModule } from './components/role-permission-row/role-permission-row.module';
import { RoleCustomizeModule } from './components/role-customize/role-customize.module';
import { RoleAdvanceRowModule } from './components/role-advance-row/role-advance-row.module';
import { NotificatioInlineModule } from 'libs/ui/src/lib/notification-inline/notification-inline.module';
@NgModule({
  declarations: [
    ProjectSettingsFeatureRolesPermissionsComponent,
    inViewportDirective
  ],
  imports: [
    CommonModule,
    TuiButtonModule,
    TuiLinkModule,
    TuiSvgModule,
    TranslocoModule,
    TuiToggleModule,
    NotificatioInlineModule,
    RolePermissionRowModule,
    RoleCustomizeModule,
    RoleAdvanceRowModule,
    RouterModule.forChild([
      {
        path: '',
        component: ProjectSettingsFeatureRolesPermissionsComponent
      }
    ]),
    InputsModule
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
export class ProjectsSettingsFeatureRolesPermissionsModule { }
