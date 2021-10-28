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
import { WorkspaceMockFactory } from '@taiga/data';
import { ActivatedRoute } from '@angular/router';

const workspaceSlug = faker.lorem.slug();

describe('TemplateStepComponent', () => {
  let spectator: Spectator<TemplateStepComponent>;

  const createComponent = createComponentFactory({
    component: TemplateStepComponent,
    imports: [
      getTranslocoModule(),
    ],
    providers: [
      FormBuilder,
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParamMap: {
              get: () => {
                return workspaceSlug;
              }
            }
          }
        }
      }
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
    expect(spectator.component.getParams).toHaveBeenCalled;
  });

  it('test that no workspace is activated', () => {
    spectator.component.workspaces = [];
    spectator.component.initForm();
    spectator.component.getParams();
    expect(spectator.component.createProjectForm.get('workspace')?.value).toBe(null);
  });

  it('test that a workspace is activated', () => {
    const workspace = WorkspaceMockFactory();
    workspace.slug = workspaceSlug;
    spectator.component.workspaces = [workspace];
    spectator.component.initForm();
    spectator.component.getParams();
    expect(spectator.component.createProjectForm.get('workspace')?.value).toBe(workspace);
  });

  it('test that form gets initializated', () => {
    const workspace = WorkspaceMockFactory();
    spectator.component.workspaces = [workspace];
    spectator.component.initForm();
    expect(spectator.component.createProjectForm.get('workspace')?.value).toBe(null);
  });

  it('test that form creates blank project', () => {
    const workspace = WorkspaceMockFactory();
    spectator.component.initForm();
    spectator.component.createProjectForm.get('workspace')?.setValue(workspace);
    spectator.component.createBlankProject();
    spectator.component.templateSelected.subscribe((emit) => {
      expect(emit).toHaveBeenCalledWith({
        step: 'detail',
        workspace
      });
    });
  });

});
