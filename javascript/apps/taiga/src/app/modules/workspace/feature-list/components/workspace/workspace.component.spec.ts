/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import '@ng-web-apis/universal/mocks';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action, MemoizedSelector } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Project, ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import { Observable } from 'rxjs';
import { WorkspaceState } from '~/app/modules/workspace/feature-list/+state/reducers/workspace.reducer';
import { selectRejectedInvites } from '~/app/modules/workspace/feature-list/+state/selectors/workspace.selectors';
import { WorkspaceComponent } from './workspace.component';

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

    // Mock user role
    workspaceItem.userIsOwner = false;

    // Mock user role
    workspaceItem.userRole = 'admin';

    // Mock latestProjects
    workspaceItem.latestProjects = [];

    const rejectedInvited: Project['id'][] = [];

    mockRejectInviteSelect.setResult(rejectedInvited);
    store.refreshState();

    expect(spectator.component.checkWsVisibility(workspaceItem)).toBeTruthy();
  });

  it('check WS visibility - owner', () => {
    const workspaceItem = WorkspaceMockFactory();

    // Mock user role
    workspaceItem.userIsOwner = true;

    // Mock user role
    workspaceItem.userRole = 'member';

    // Mock latestProjects
    workspaceItem.latestProjects = [];

    // Mock rejectedProjects
    const rejectedInvited: Project['id'][] = [];
    mockRejectInviteSelect.setResult(rejectedInvited);
    store.refreshState();

    expect(spectator.component.checkWsVisibility(workspaceItem)).toBeTruthy();
  });

  it('check WS visibility - hasProjects', () => {
    const workspaceItem = WorkspaceMockFactory();

    // Mock user role
    workspaceItem.userIsOwner = false;

    // Mock user role
    workspaceItem.userRole = 'guest';

    // Mock latestProjects
    const project = ProjectMockFactory();
    workspaceItem.latestProjects = [project];

    // Mock rejectedProjects
    const rejectedInvited: Project['id'][] = [];
    mockRejectInviteSelect.setResult(rejectedInvited);
    store.refreshState();

    expect(spectator.component.checkWsVisibility(workspaceItem)).toBeTruthy();
  });

  it('check WS visibility - hasInvites', () => {
    const workspaceItem = WorkspaceMockFactory();

    // Mock user role
    workspaceItem.userIsOwner = false;

    // Mock user role
    workspaceItem.userRole = 'guest';

    // Mock latestProjects
    workspaceItem.latestProjects = [];

    // Mock rejectedProjects
    const rejectedInvited: Project['id'][] = [];
    mockRejectInviteSelect.setResult(rejectedInvited);
    store.refreshState();

    const exampleInvite = ProjectMockFactory();
    workspaceItem.invitedProjects = [exampleInvite];

    expect(spectator.component.checkWsVisibility(workspaceItem)).toBeTruthy();
  });

  it('check WS visibility - hasInvites - rejected', () => {
    const workspaceItem = WorkspaceMockFactory();

    // Mock user role
    workspaceItem.userIsOwner = false;

    // Mock user role
    workspaceItem.userRole = 'guest';

    // Mock latestProjects
    workspaceItem.latestProjects = [];

    // Mock rejectedProjects
    const exampleInvite = ProjectMockFactory();

    const rejectedInvited: Project['id'][] = [exampleInvite.id];
    mockRejectInviteSelect.setResult(rejectedInvited);
    store.refreshState();

    workspaceItem.invitedProjects = [exampleInvite];

    expect(spectator.component.checkWsVisibility(workspaceItem)).toBeFalsy();
  });
});
