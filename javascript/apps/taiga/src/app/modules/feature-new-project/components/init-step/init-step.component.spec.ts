/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { SimpleChange } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  randCompanyName,
  randDomainSuffix,
  randNumber,
  randUuid,
} from '@ngneat/falso';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { WorkspaceMockFactory } from '@taiga/data';
import { WsService, WsServiceMock } from '~/app/services/ws';
import { RouteHistoryService } from '~/app/shared/route-history/route-history.service';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import { InitStepComponent } from './init-step.component';

const workspaceId = randUuid();

describe('InitStepComponent', () => {
  let spectator: Spectator<InitStepComponent>;
  const initialState = { project: null };

  const createComponent = createComponentFactory({
    component: InitStepComponent,
    imports: [getTranslocoModule()],
    providers: [
      provideMockStore({ initialState }),
      {
        provide: RouteHistoryService,
        useValue: {
          getPreviousUrl: () => {
            return '/workspace';
          },
        },
      },
      { provide: WsService, useValue: WsServiceMock },
      FormBuilder,
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParamMap: {
              get: () => {
                return workspaceId;
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
            id: randUuid(),
            name: randCompanyName(),
            slug: randDomainSuffix({ length: 3 }).join('-'),
            color: randNumber(),
            latestProjects: [],
            invitedProjects: [],
            totalProjects: 0,
            hasProjects: true,
            userRole: 'member',
          },
        ],
      },
      detectChanges: false,
    });

    spectator.component.events = jest.fn();
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
    workspace.id = workspaceId;
    workspace.userRole = 'member';
    spectator.component.workspaces = [workspace];
    spectator.component.selectedWorkspaceId = workspace.id;
    spectator.component.initForm();
    spectator.component.ngOnChanges({
      workspaces: new SimpleChange(null, spectator.component.workspaces, false),
    });

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
