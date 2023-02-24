/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { EffectsModule } from '@ngrx/effects';
import { TuiAutoFocusModule } from '@taiga-ui/cdk';
import { TuiSvgModule } from '@taiga-ui/core';
import { TuiDataListWrapperModule, TuiSelectModule } from '@taiga-ui/kit';
import { AvatarModule } from '@taiga/ui/avatar';
import { ModalModule } from '@taiga/ui/modal';
import { ImageUploadModule } from 'libs/ui/src/lib/inputs/image-upload/image-upload.module';
import { InputsModule } from 'libs/ui/src/lib/inputs/inputs.module';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { ButtonLoadingModule } from '~/app/shared/directives/button-loading/button-loading.module';
import { TitleDirective } from '~/app/shared/title/title.directive';
import { NewProjectEffects } from './+state/effects/new-project.effects';
import { InitStepComponent } from './components/init-step/init-step.component';
import { NewProjectComponent } from './components/new-project/new-project.component';
import { TemplateStepComponent } from './components/template-step/template-step.component';
import { FeatureNewProjectRoutingModule } from './feature-new-project-routing.module';

@NgModule({
  declarations: [NewProjectComponent, InitStepComponent, TemplateStepComponent],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    EffectsModule.forFeature([NewProjectEffects]),
    TuiSvgModule,
    TuiSelectModule,
    TuiDataListWrapperModule,
    TuiAutoFocusModule,
    AvatarModule,
    RouterModule,
    CommonTemplateModule,
    InputsModule,
    ImageUploadModule,
    ModalModule,
    FeatureNewProjectRoutingModule,
    ButtonLoadingModule,
    TitleDirective,
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
export class FeatureNewProjectModule {}
