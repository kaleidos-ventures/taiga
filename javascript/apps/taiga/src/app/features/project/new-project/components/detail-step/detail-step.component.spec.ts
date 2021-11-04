/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import '@ng-web-apis/universal/mocks';

import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';

import { FormBuilder } from '@angular/forms';
import { DetailStepComponent } from './detail-step.component';

import * as faker from 'faker';
import { WorkspaceMockFactory } from '@taiga/data';

describe('TemplateStepComponent', () => {
  let spectator: Spectator<DetailStepComponent>;

  const createComponent = createComponentFactory({
    component: DetailStepComponent,
    imports: [
      getTranslocoModule(),
    ],
    providers: [
      FormBuilder,
    ],
    declareComponent: false,
  });
  
  beforeEach(() => {
    spectator = createComponent({
      props: {
        selectedWorkspaceSlug: faker.lorem.slug()
      },
      detectChanges: false
    });
  });

  it('getCurrentWorkspace', () => {
    const slug = faker.lorem.slug();

    const workspace = WorkspaceMockFactory();
    workspace.slug = slug;
    spectator.component.workspaces = [workspace];

    spectator.component.selectedWorkspaceSlug = slug;

    expect(spectator.component.getCurrentWorkspace()).toEqual(workspace);
  });

  it('onAddProjectImage', () => {
    spectator.component.getCurrentWorkspace = jest.fn();
    const file = new File([""], "filename", {type: "image/jpeg"});
    spectator.component.initForm();
    spectator.component.onAddProjectImage(file);

    expect(spectator.component.detailProjectForm.get('icon')?.value).toEqual(file);
  });
});
