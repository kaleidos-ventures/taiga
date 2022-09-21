/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { TuiButtonModule, TuiSvgModule } from '@taiga-ui/core';
import { AvatarModule } from '@taiga/ui/avatar';
import { ProjectNavigationMenuComponent } from './components/project-navigation-menu/project-navigation-menu.component';
import { ProjectNavigationSettingsComponent } from './components/project-navigation-settings/project-navigation-settings.component';
import { ProjectNavigationComponent } from './project-feature-navigation.component';

@NgModule({
  imports: [
    CommonModule,
    TuiButtonModule,
    TuiSvgModule,
    TranslocoModule,
    A11yModule,
    RouterModule,
    AvatarModule,
    ProjectNavigationSettingsComponent,
    ProjectNavigationMenuComponent,
  ],
  providers: [],
  declarations: [ProjectNavigationComponent],
  exports: [ProjectNavigationComponent],
})
export class ProjectFeatureNavigationModule {}
