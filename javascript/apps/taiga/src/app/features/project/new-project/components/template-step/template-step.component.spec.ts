/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';

import { TemplateStepComponent } from './template-step.component';

import * as faker from 'faker';
import { FormBuilder } from '@angular/forms';

describe('TemplateStepComponent', () => {
  let spectator: Spectator<TemplateStepComponent>;

  const createComponent = createComponentFactory({
    component: TemplateStepComponent,
    imports: [
      getTranslocoModule(),
    ],
    providers: [
      FormBuilder
    ],
    declareComponent: false,
    mocks: [],
  });
  
  beforeEach(() => {
    spectator = createComponent({
      props: {
        workspaces: [{
          id: faker.datatype.number(),
          name: faker.company.companyName(),
          slug: faker.lorem.slug(),
          color: faker.datatype.number(),
        }
        ]
      },
      detectChanges: false
    });
    
  });

  it('test that form gets initializated', () => {
    spectator.component.ngOnInit();
    expect(spectator.component.initForm).toHaveBeenCalled;
  });

  it('test that form gets initializated', () => {
    spectator.component.initForm();
    expect(spectator.component.createProjectForm.get('workspace')?.value).toBe(spectator.component.workspaces[0]);
  });
});
