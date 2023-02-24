/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { RouterTestingModule } from '@angular/router/testing';
import { randUuid } from '@ngneat/falso';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';
import { fetchWorkspaceList } from '~/app/modules/workspace/feature-list/+state/actions/workspace.actions';
import { NewProjectComponent } from './new-project.component';

describe('NewProjectComponent', () => {
  let spectator: Spectator<NewProjectComponent>;
  let actions$: Observable<Action>;

  const initialState = { project: null };
  let store: MockStore;

  const createComponent = createComponentFactory({
    component: NewProjectComponent,
    providers: [
      provideMockStore({ initialState }),
      provideMockActions(() => actions$),
    ],
    imports: [RouterTestingModule],
    declareComponent: false,
    mocks: [],
  });

  beforeEach(() => {
    spectator = createComponent({
      detectChanges: false,
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

    const workspaceId = randUuid();
    const step = 'template';
    spectator.component.onSelectTemplate(step, workspaceId);
    expect(spectator.component.formData.workspaceId).toEqual(workspaceId);
    expect(spectator.component.setStep).toBeCalledWith(step);
  });
});
