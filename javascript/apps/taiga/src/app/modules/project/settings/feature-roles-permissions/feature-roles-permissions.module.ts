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
import { ProjectsSettingsFeatureRolesPermissionsComponent } from './feature-roles-permissions.component';
import { inViewportDirective } from '~/app/shared/directives/intersection-observer.directive';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { TuiButtonModule, TuiLinkModule } from '@taiga-ui/core';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';

@NgModule({
  declarations: [
    ProjectsSettingsFeatureRolesPermissionsComponent,
    inViewportDirective
  ],
  imports: [
    CommonModule,
    TuiButtonModule,
    TuiLinkModule,
    TranslocoModule,
    RouterModule.forChild([
      {
        path: '',
        component: ProjectsSettingsFeatureRolesPermissionsComponent
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
  exports: [
    ProjectsSettingsFeatureRolesPermissionsComponent,
    inViewportDirective
  ],
})
export class ProjectsSettingsFeatureRolesPermissionsModule { }
