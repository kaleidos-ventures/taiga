/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */
import { FormBuilder } from '@angular/forms';
import { randUuid } from '@ngneat/falso';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { WorkspaceMockFactory } from '@taiga/data';
import { WsService, WsServiceMock } from '~/app/services/ws';
import { RouteHistoryService } from '~/app/shared/route-history/route-history.service';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import { TemplateStepComponent } from './template-step.component';

describe('TemplateStepComponent', () => {
  let spectator: Spectator<TemplateStepComponent>;
  const initialState = { project: null };

  const createComponent = createComponentFactory({
    component: TemplateStepComponent,
    imports: [getTranslocoModule()],
    providers: [
      FormBuilder,
      provideMockStore({ initialState }),
      { provide: WsService, useValue: WsServiceMock },
    ],
    mocks: [RouteHistoryService],
    declareComponent: false,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        selectedWorkspaceId: randUuid(),
      },
      detectChanges: false,
    });
    spectator.component.events = jest.fn();
  });

  it('getCurrentWorkspace', () => {
    const id = randUuid();

    const workspace = WorkspaceMockFactory();
    workspace.id = id;
    spectator.component.workspaces = [workspace];

    spectator.component.selectedWorkspaceId = id;

    expect(spectator.component.getCurrentWorkspace()).toEqual(workspace);
  });
});
