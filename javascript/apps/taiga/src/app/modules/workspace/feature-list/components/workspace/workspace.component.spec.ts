/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action, MemoizedSelector } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Project, ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import { Observable } from 'rxjs';
import { WorkspaceState } from '~/app/modules/workspace/feature-list/+state/reducers/workspace.reducer';
import { selectRejectedInvites } from '~/app/modules/workspace/feature-list/+state/selectors/workspace.selectors';
import { WorkspaceComponent } from './workspace.component';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('Workspace List', () => {
  let actions$: Observable<Action>;

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
    mocks: [],
    providers: [
      provideMockStore({ initialState }),
      provideMockActions(() => actions$),
    ],
    shallow: true,
    overrideComponents: [
      [
        WorkspaceComponent,
        {
          set: {
            imports: [CommonModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
          },
        },
      ],
    ],
  });

  let store: MockStore;
  let mockRejectInviteSelect: MemoizedSelector<WorkspaceState, Project['id'][]>;

  beforeEach(() => {
    spectator = createComponent({
      detectChanges: false,
    });

    store = spectator.inject(MockStore);

    mockRejectInviteSelect = store.overrideSelector(selectRejectedInvites, []);
  });

  it('setCardAmounts should give new amount of project to show', () => {
    spectator.component.setCardAmounts(1);
    expect(spectator.component.amountOfProjectsToShow).toEqual(1);

    spectator.component.setCardAmounts(1500);
    expect(spectator.component.amountOfProjectsToShow).toEqual(6);

    spectator.component.setCardAmounts(1750);
    expect(spectator.component.amountOfProjectsToShow).toEqual(6);
  });

  it('check WS visibility - admin', () => {
    const workspaceItem = WorkspaceMockFactory();

    workspaceItem.userRole = 'admin';

    workspaceItem.latestProjects = [];

    const rejectedInvited: Project['id'][] = [];

    mockRejectInviteSelect.setResult(rejectedInvited);
    store.refreshState();

    expect(spectator.component.checkWsVisibility(workspaceItem)).toBeTruthy();
  });

  it('check WS visibility - hasProjects', () => {
    const workspaceItem = WorkspaceMockFactory();
    workspaceItem.userRole = 'guest';

    const project = ProjectMockFactory();
    workspaceItem.latestProjects = [project];

    const rejectedInvited: Project['id'][] = [];
    mockRejectInviteSelect.setResult(rejectedInvited);
    store.refreshState();

    expect(spectator.component.checkWsVisibility(workspaceItem)).toBeTruthy();
  });

  it('check WS visibility - hasInvites', () => {
    const workspaceItem = WorkspaceMockFactory();

    workspaceItem.userRole = 'guest';

    workspaceItem.latestProjects = [];

    const rejectedInvited: Project['id'][] = [];
    mockRejectInviteSelect.setResult(rejectedInvited);
    store.refreshState();

    const exampleInvite = ProjectMockFactory();
    workspaceItem.invitedProjects = [exampleInvite];

    expect(spectator.component.checkWsVisibility(workspaceItem)).toBeTruthy();
  });

  it('check WS visibility - hasInvites - rejected', () => {
    const workspaceItem = WorkspaceMockFactory();

    workspaceItem.userRole = 'guest';

    workspaceItem.latestProjects = [];

    const exampleInvite = ProjectMockFactory();

    const rejectedInvited: Project['id'][] = [exampleInvite.id];
    mockRejectInviteSelect.setResult(rejectedInvited);
    store.refreshState();

    workspaceItem.invitedProjects = [exampleInvite];

    expect(spectator.component.checkWsVisibility(workspaceItem)).toBeFalsy();
  });
});
