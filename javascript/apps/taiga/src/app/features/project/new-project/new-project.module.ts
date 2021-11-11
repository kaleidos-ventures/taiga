/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EffectsModule } from '@ngrx/effects';
import { NewProjectEffects } from './effects/new-project.effects';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  TuiSvgModule,
  TuiButtonModule,
} from '@taiga-ui/core';
import { TuiSelectModule, TuiDataListWrapperModule } from '@taiga-ui/kit';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';

import { NewProjectComponent } from './components/new-project/new-project.component';
import { InitStepComponent } from './components/init-step/init-step.component';
import { RouterModule } from '@angular/router';
import { InputsModule } from 'libs/ui/src/lib/inputs/inputs.module';
import { InviteStepComponent } from './components/invite-step/invite-step.component';
import { FileUploadModule } from 'libs/ui/src/lib/inputs/file-upload/file-upload.module';
import { AvatarModule } from '@taiga/ui/avatar';
import { TuiAutoFocusModule } from '@taiga-ui/cdk';
import { ModalModule } from '@taiga/ui/modal';
import { TemplateStepComponent } from './components/template-step/template-step.component';

@NgModule({
  declarations: [
    NewProjectComponent,
    InitStepComponent,
    TemplateStepComponent,
    InviteStepComponent,
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    TranslocoModule,
    EffectsModule.forFeature([NewProjectEffects]),
    TuiSvgModule,
    FormsModule,
    ReactiveFormsModule,
    TuiSelectModule,
    TuiDataListWrapperModule,
    TuiAutoFocusModule,
    AvatarModule,
    RouterModule,
    TuiButtonModule,
    InputsModule,
    FileUploadModule,
    ModalModule
  ],
  exports: [
    NewProjectComponent,
    InitStepComponent,
    TemplateStepComponent,
    InviteStepComponent,
    ModalModule
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'new_project',
        alias: 'new_project',
      },
    },
  ],
})
export class NewProjectModule {}
