/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';

import { InitStepComponent } from './init-step.component';

import { randDomainSuffix, randNumber, randCompanyName } from '@ngneat/falso';
import { FormBuilder } from '@angular/forms';
import { WorkspaceMockFactory } from '@taiga/data';
import { ActivatedRoute } from '@angular/router';
import { RouteHistoryService } from '~/app/shared/route-history/route-history.service';

const workspaceSlug = randDomainSuffix({ length: 3 }).join('-');

describe('InitStepComponent', () => {
  let spectator: Spectator<InitStepComponent>;

  const createComponent = createComponentFactory({
    component: InitStepComponent,
    imports: [getTranslocoModule()],
    providers: [
      {
        provide: RouteHistoryService,
        useValue: {
          getPreviousUrl: () => {
            return '/workspace';
          },
        },
      },
      FormBuilder,
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParamMap: {
              get: () => {
                return workspaceSlug;
              },
            },
          },
        },
      },
    ],
    declareComponent: false,
    mocks: [],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        workspaces: [
          {
            id: randNumber(),
            name: randCompanyName(),
            slug: randDomainSuffix({ length: 3 }).join('-'),
            color: randNumber(),
            latestProjects: [],
            totalProjects: 0,
          },
        ],
      },
      detectChanges: false,
    });
  });

  it('test that form gets initializated', () => {
    spectator.component.ngOnInit();
    expect(spectator.component.initForm).toHaveBeenCalled;
    expect(spectator.component.getLastRoute).toHaveBeenCalled;
  });

  it('test that workspace gets readonly', () => {
    spectator.component.getLastRoute();
    expect(spectator.component.readonlyWorkspace).toBeTruthy();
  });

  it('test that no workspace is activated', () => {
    spectator.component.workspaces = [];
    spectator.component.initForm();
    expect(spectator.component.createProjectForm.get('workspace')?.value).toBe(
      null
    );
  });

  it('test that a workspace is activated', () => {
    const workspace = WorkspaceMockFactory();
    workspace.slug = workspaceSlug;
    spectator.component.workspaces = [workspace];
    spectator.component.selectedWorkspaceSlug = workspace.slug;
    spectator.component.initForm();
    expect(spectator.component.createProjectForm.get('workspace')?.value).toBe(
      workspace
    );
  });

  it('test that form gets initializated', () => {
    const workspace = WorkspaceMockFactory();
    spectator.component.workspaces = [workspace];
    spectator.component.initForm();
    expect(spectator.component.createProjectForm.get('workspace')?.value).toBe(
      null
    );
  });

  it('test that form creates blank project', () => {
    const workspace = WorkspaceMockFactory();
    spectator.component.initForm();
    spectator.component.createProjectForm.get('workspace')?.setValue(workspace);
    spectator.component.initProject('blank');
    spectator.component.templateSelected.subscribe((emit) => {
      expect(emit).toHaveBeenCalledWith({
        step: 'blank',
        workspace,
      });
    });
  });
});
