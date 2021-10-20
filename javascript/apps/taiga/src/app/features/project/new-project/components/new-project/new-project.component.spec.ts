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
import { NewProjectComponent } from './new-project.component';
import { WorkspaceMockFactory } from '@taiga/data';
import { stepData } from '~/app/features/project/new-project/data/new-project.model';

describe('NewProjectComponent', () => {
  let spectator: Spectator<NewProjectComponent>;

  const initialState = { project: null };
  let store: MockStore;

  const createComponent = createComponentFactory({
    component: NewProjectComponent,
    providers: [
      provideMockStore({ initialState }),
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
    const workspace = WorkspaceMockFactory();
    const data: stepData = {
      workspace,
      step: 'detail'
    };
    spectator.component.onSelectTemplate(data);
    expect(spectator.component.formData.workspaceSlug).toEqual(data.workspace.slug);
    expect(spectator.component.currentStep).toEqual(data.step);
  });
});
