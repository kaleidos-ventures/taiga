/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TuiAutoFocusModule } from '@taiga-ui/cdk';
import { TuiDataListModule, TuiLinkModule, TuiSvgModule } from '@taiga-ui/core';
import { TuiAvatarModule, TuiBadgedContentModule } from '@taiga-ui/kit';
import { AvatarModule } from '@taiga/ui/avatar';
import { CommonTemplateModule } from '../common-template.module';
import { AutoFocusDirective } from '../directives/auto-focus/auto-focus.directive';
import { DropdownModule } from '../dropdown/dropdown.module';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { NavigationProjectsComponent } from './navigation-projects/navigation-projects.component';
import { NavigationUserDropdownComponent } from './navigation-user-dropdown/navigation-user-dropdown.component';
import { NavigationComponent } from './navigation.component';

@NgModule({
  imports: [
    TuiAvatarModule,
    TuiLinkModule,
    TuiSvgModule,
    TuiDataListModule,
    CommonTemplateModule,
    UserAvatarComponent,
    TuiAutoFocusModule,
    RouterModule,
    AvatarModule,
    DropdownModule,
    TuiBadgedContentModule,
    AutoFocusDirective,
  ],
  declarations: [
    NavigationComponent,
    NavigationUserDropdownComponent,
    NavigationProjectsComponent,
  ],
  providers: [],
  exports: [
    NavigationComponent,
    NavigationUserDropdownComponent,
    NavigationProjectsComponent,
  ],
})
export class NavigationModule {}
