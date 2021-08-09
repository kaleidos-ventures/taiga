/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { TranslocoModule } from '@ngneat/transloco';
import { TuiButtonModule, TuiSvgModule } from '@taiga-ui/core';
import { TuiAvatarModule } from '@taiga-ui/kit';
import { NavigationModule } from './navigation/navigation.module';

@NgModule({
  imports: [
    TuiButtonModule,
    TuiAvatarModule,
    TranslocoModule,
    TuiSvgModule,
    NavigationModule
  ],
  declarations: [

  ],
  providers: [],
  exports: [
    NavigationModule
  ]
})
export class CommonsModule {}
