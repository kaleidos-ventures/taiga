/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import '@ng-web-apis/universal/mocks';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { WorkspaceMockFactory } from '@taiga/data';
import { provideMockStore } from '@ngrx/store/testing';
import { WorkspaceComponent } from './workspace.component';

describe('Workspace List', () => {
  const workspaceItem = WorkspaceMockFactory();

  const initialState = {
    creatingWorkspace: false,
    showCreate: false,
    loading: false,
    workspaceList: [workspaceItem],
    createFormHasError: false,
  };

  let spectator: Spectator<WorkspaceComponent>;
  const createComponent = createComponentFactory({
    component: WorkspaceComponent,
    imports: [],
    providers: [provideMockStore({ initialState })],
  });

  beforeEach(() => {
    spectator = createComponent({
      detectChanges: false,
    });
  });

  it('setCardAmounts should give new amount of project to show', () => {
    spectator.component.setCardAmounts(1);
    expect(spectator.component.amountOfProjectsToShow).toEqual(1);

    spectator.component.setCardAmounts(1500);
    expect(spectator.component.amountOfProjectsToShow).toEqual(6);

    spectator.component.setCardAmounts(1750);
    expect(spectator.component.amountOfProjectsToShow).toEqual(6);
  });
});
