/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Spectator, createComponentFactory } from '@ngneat/spectator';

import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { provideMockStore } from '@ngrx/store/testing';
import { StatusMockFactory, WorkflowMockFactory } from '@taiga/data';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import { EditStatusComponent } from './edit-status.component';

const status = StatusMockFactory();
const initialState = {};

describe('EditStatusComponent', () => {
  let spectator: Spectator<EditStatusComponent>;

  const createComponent = createComponentFactory({
    component: EditStatusComponent,
    imports: [getTranslocoModule()],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [provideMockStore({ initialState })],
  });

  beforeEach(() => {
    spectator = createComponent({
      detectChanges: false,
    });
  });

  it('initStatusColor - has status', () => {
    spectator.component.status = status;
    spectator.component.initStatusColor();
    expect(spectator.component.color).toBe(status.color);
  });

  it('initStatusColor - has status', () => {
    const workflow = signal(WorkflowMockFactory(4));
    workflow.mutate((it) => it.statuses.map((status) => (status.color = 1)));
    spectator.component.workflow = workflow;
    spectator.component.initStatusColor();
    expect(spectator.component.color).toBe(2);
  });
});
