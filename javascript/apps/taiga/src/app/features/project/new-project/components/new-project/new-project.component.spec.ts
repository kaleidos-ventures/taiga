/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { fetchWorkspaceList } from '~/app/features/workspace/actions/workspace.actions';
import { RouterTestingModule } from '@angular/router/testing';
import { NewProjectComponent } from './new-project.component';

import * as faker from 'faker';

describe('NewProjectComponent', () => {
  let spectator: Spectator<NewProjectComponent>;

  const initialState = { project: null };
  let store: MockStore;

  const createComponent = createComponentFactory({
    component: NewProjectComponent,
    providers: [
      provideMockStore({ initialState }),
    ],
    imports: [
      RouterTestingModule,
    ],
    declareComponent: false,
    mocks: [],
  });

  beforeEach(() => {
    spectator = createComponent({
      detectChanges: false
    });
    store = spectator.inject(MockStore);
  });

  it('onInit', () => {
    store.dispatch = jest.fn();
    const action = fetchWorkspaceList();
    spectator.component.ngOnInit();
    expect(store.dispatch).toBeCalledWith(action);
  });

  it('on select template', () => {
    spectator.component.setStep = jest.fn();

    const workspaceSlug = faker.lorem.slug();
    const step = 'template';
    spectator.component.onSelectTemplate(step, workspaceSlug);
    expect(spectator.component.formData.workspaceSlug).toEqual(workspaceSlug);
    expect(spectator.component.setStep).toBeCalledWith(step);
  });
});
