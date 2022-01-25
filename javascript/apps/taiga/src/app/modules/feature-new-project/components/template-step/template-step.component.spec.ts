/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';

import { FormBuilder } from '@angular/forms';
import { TemplateStepComponent } from './template-step.component';

import { randDomainSuffix } from '@ngneat/falso';
import { WorkspaceMockFactory } from '@taiga/data';
import { RouteHistoryService } from '~/app/shared/route-history/route-history.service';

describe('TemplateStepComponent', () => {
  let spectator: Spectator<TemplateStepComponent>;

  const createComponent = createComponentFactory({
    component: TemplateStepComponent,
    imports: [getTranslocoModule()],
    providers: [FormBuilder],
    mocks: [RouteHistoryService],
    declareComponent: false,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        selectedWorkspaceSlug: randDomainSuffix({ length: 3 }).join('-'),
      },
      detectChanges: false,
    });
  });

  it('getCurrentWorkspace', () => {
    const slug = randDomainSuffix({ length: 3 }).join('-');

    const workspace = WorkspaceMockFactory();
    workspace.slug = slug;
    spectator.component.workspaces = [workspace];

    spectator.component.selectedWorkspaceSlug = slug;

    expect(spectator.component.getCurrentWorkspace()).toEqual(workspace);
  });
});
