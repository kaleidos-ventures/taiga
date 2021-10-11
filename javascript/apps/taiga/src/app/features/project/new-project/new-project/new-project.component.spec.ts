/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { FormBuilder, FormGroup } from '@angular/forms';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { fetchWorkspaceList } from '~/app/features/workspace/actions/workspace.actions';
import { NewProjectComponent } from './new-project.component';

describe('NewProjectComponent', () => {
  let spectator: Spectator<NewProjectComponent>;

  const initialState = { project: null };
  let store: MockStore;

  const createComponent = createComponentFactory({
    component: NewProjectComponent,
    providers: [
      provideMockStore({ initialState }),
      FormBuilder
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

  it('test form', () => {
    const form: FormGroup = spectator.component.createProjectForm;
    const values = {
      workspace: ''
    };
    spectator.component.initForm();
    expect(form.value).toEqual(values);
  });
});
